import Database from "@tauri-apps/plugin-sql";
import { invoke } from "@tauri-apps/api/core";
import { parseHtmlForRates, hashString } from "./jveg-parser";

let dbPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (dbPromise) return dbPromise;
  
  dbPromise = (async () => {
    const db = await Database.load("sqlite:cortex.db");
    await runMigrations(db);
    return db;
  })();
  
  return dbPromise;
}

async function runMigrations(db: Database) {
  // Create tables if they don't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS courts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department TEXT DEFAULT 'Abteilung für Betreuungssachen',
      street TEXT NOT NULL,
      zip TEXT NOT NULL,
      city TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS remuneration_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value REAL NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT,
      patient_name TEXT NOT NULL,
      patient_birthdate TEXT NOT NULL,
      file_number TEXT NOT NULL,
      court_id INTEGER NOT NULL,
      remuneration_group_id INTEGER NOT NULL,
      travel_time INTEGER DEFAULT 0,
      travel_count REAL DEFAULT 1,
      preparation_time INTEGER DEFAULT 0,
      evaluation_time INTEGER DEFAULT 0,
      writing_characters INTEGER DEFAULT 0,
      printing_pages INTEGER DEFAULT 0,
      km_count REAL DEFAULT 0,
      shipping_fee REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      printing_date TEXT,
      paid_at TEXT,
      total_minutes INTEGER,
      rounded_minutes INTEGER,
      time_euro REAL,
      writing_euro REAL,
      printing_euro REAL,
      km_euro REAL,
      shipping_euro REAL,
      net_euro REAL,
      tax_euro REAL,
      gross_euro REAL,
      remuneration_group_value REAL,
      writing_fee_rate REAL,
      printing_fee_rate REAL,
      km_fee_rate REAL,
      tax_rate REAL,
      FOREIGN KEY (court_id) REFERENCES courts(id),
      FOREIGN KEY (remuneration_group_id) REFERENCES remuneration_groups(id)
    )
  `);

  // Default entries for courts
  const courtsCount = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM courts");
  if (courtsCount[0].count === 0) {
    await db.execute(`
      INSERT INTO courts (name, department, street, zip, city)
      VALUES ('Amtsgericht Fürth', 'Abteilung für Betreuungssachen', 'Hallstraße 1', '90762', 'Fürth')
    `);
  }

  // Default entries for remuneration groups
  const remCount = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM remuneration_groups");
  if (remCount[0].count === 0) {
    let initialRates = { 'M1': 80, 'M2': 90, 'M3': 120 };
    let jvegHash = "";
    
    try {
      const jsonString = await invoke<string>("fetch_jveg");
      const parsed = parseHtmlForRates(jsonString);
      if (parsed) {
        initialRates = {
          'M1': parsed['M1'] || initialRates['M1'],
          'M2': parsed['M2'] || initialRates['M2'],
          'M3': parsed['M3'] || initialRates['M3']
        };
        jvegHash = await hashString(jsonString);
      }
    } catch (error) {
      console.warn("Could not fetch initial JVEG rates via Rust, using defaults.", error);
    }

    await db.execute(`
      INSERT INTO remuneration_groups (name, value)
      VALUES ('M1', ?), ('M2', ?), ('M3', ?)
    `, [initialRates['M1'], initialRates['M2'], initialRates['M3']]);

    if (jvegHash) {
      await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('jvegLastHash', ?)", [jvegHash]);
    }
  }

  // Default entries for settings
  const defaultSettings = [
    ['userName', 'Dr. Max Mustermann'],
    ['userBirthday', '01.01.1970'],
    ['userStreet', 'Musterstraße 123'],
    ['userZip', '12345'],
    ['userCity', 'Musterstadt'],
    ['userTaxId', 'DE 123 456 789'],
    ['userBank', 'Stadt- und Kreissparkasse Erlangen'],
    ['userIban', 'DE46 7635 0000 0060 1113 31'],
    ['userBic', 'BYLADEM1ERH'],
    ['taxRate', '19'],
    ['kmFee', '0.42'],
    ['writingFee', '1.5'],
    ['printingFee', '0.5'],
    ['paymentDeadlineDays', '14'],
    ['invoiceIntro', 'Für die Erstellung eines psychiatrischen Gutachtens erlaube ich mir gemäß Vergütungsgruppe {{remunerationGroup.name}} zu berechnen:'],
    ['invoiceSubject', '{{assignment.patientName}}, geb. am {{assignment.patientBirthdate}}, Aktenzeichen: {{assignment.fileNumber}}'],
    ['invoiceTitle', 'Vergütungsantrag'],
    ['invoiceLabelTravelSingle', 'Anfahrt:'],
    ['invoiceLabelTravelMultiple', 'Anfahrten:'],
    ['invoiceLabelPreparation', 'Exploration, Fremdanamnese\nund Durchsicht der Unterlagen:'],
    ['invoiceLabelEvaluation', 'Auswertung der Untersuchung und\nder neuropsycholog. Testung,\nVerfassen des Gutachtens:'],
    ['invoiceLabelTotalTime', 'Gesamtzeit:'],
    ['invoiceLabelWriting', 'Schreibgebühr:'],
    ['invoiceLabelKm', 'Kilometerpauschale:'],
    ['invoiceLabelPrinting', 'Kopierkosten:'],
    ['invoiceLabelShipping', 'Versandkosten:'],
    ['invoiceLabelNet', 'Gesamt (Netto):'],
    ['invoiceLabelTax', 'Umsatzsteuer {{settings.taxRate}}%:'],
    ['invoiceLabelGross', 'Gesamt (Brutto):'],
    ['invoiceFooter', 'Ich bitte um Überweisung unter Angabe der Rechnungsnummer auf folgendes Konto:\n\n{{settings.userName}}, {{settings.userBank}},\n\nIBAN: {{settings.userIban}}, BIC: {{settings.userBic}}'],
    ['jvegLastHash', ''],
    ['jvegLastCheckFailed', 'false']
  ];

  for (const [key, value] of defaultSettings) {
    const exists = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM settings WHERE key = ?", [key]);
    if (exists[0].count === 0) {
      await db.execute("INSERT INTO settings (key, value) VALUES (?, ?)", [key, value]);
    }
  }
}
