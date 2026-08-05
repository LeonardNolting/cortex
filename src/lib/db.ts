import Database from "@tauri-apps/plugin-sql";
import { invoke } from "@tauri-apps/api/core";
import { parseHtmlForRates, hashString } from "./jveg-parser";
import { appDataDir, join } from "@tauri-apps/api/path";
import { copyFile, mkdir, exists } from "@tauri-apps/plugin-fs";
import { DEFAULT_INVOICE_FILE_NAME } from "../types";
import { getDefaultBackupPath } from "./paths";

let dbInstance: Database | null = null;
let dbPromise: Promise<Database> | null = null;
let activeQueries = 0;
let isLocked = false;
let lockPromise: Promise<void> | null = null;

export async function getDb(): Promise<Database> {
  // Wait if database is locked for backup
  if (isLocked && lockPromise) {
    await lockPromise;
  }

  if (dbInstance) return dbInstance;
  if (dbPromise) return dbPromise;
  
  dbPromise = (async () => {
    const db = await Database.load("sqlite:cortex.db");
    await runMigrations(db);
    
    // Wrap the database to track active queries and ensure it can be closed safely
    const wrapper = {
      path: db.path,
      execute: async (query: string, bindValues?: any[]) => {
        activeQueries++;
        try {
          return await db.execute(query, bindValues);
        } finally {
          activeQueries--;
        }
      },
      select: async <T>(query: string, bindValues?: any[]) => {
        activeQueries++;
        try {
          return await db.select<T>(query, bindValues);
        } finally {
          activeQueries--;
        }
      },
      close: async () => {
        return await db.close();
      }
    } as unknown as Database;

    dbInstance = wrapper;
    return wrapper;
  })();
  
  return dbPromise;
}

/**
 * Closes the database and performs a file-level backup.
 * Queues any incoming database requests until the backup is complete.
 */
export async function performBackup(reason: string): Promise<string> {
  // Don't start another backup if one is already in progress
  if (isLocked) {
    if (lockPromise) await lockPromise;
    return "Backup already in progress, waited for it to finish.";
  }

  // 1. Get backup location before locking
  const db = await getDb();
  const settingsRows = await db.select<{ value: string }[]>("SELECT value FROM settings WHERE key = 'backupLocation'");
  const customBackupLocation = settingsRows.length > 0 ? settingsRows[0].value : "";

  // 2. Set lock to queue new queries
  let resolveLock: (() => void) | null = null;
  lockPromise = new Promise((resolve) => {
    resolveLock = resolve;
  });
  isLocked = true;

  try {
    // 3. Wait for current queries to finish (idle)
    while (activeQueries > 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 4. Close the database connection
    if (dbInstance) {
      await dbInstance.close();
      dbInstance = null;
      dbPromise = null;
    }

    // 5. Determine paths
    const appDataPath = await appDataDir();
    const dbFilePath = await join(appDataPath, "cortex.db");
    
    let backupDir = customBackupLocation;
    if (!backupDir) {
      backupDir = await getDefaultBackupPath();
    }

    // Ensure backup directory exists
    if (!(await exists(backupDir))) {
      await mkdir(backupDir, { recursive: true });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds();
    const backupFileName = `cortex_${reason}_${timestamp}.db`;
    const backupPath = await join(backupDir, backupFileName);

    // 6. Copy the database file
    await copyFile(dbFilePath, backupPath);
    
    console.log(`Database backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error("Backup failed:", error);
    throw error;
  } finally {
    // 7. Release the lock
    isLocked = false;
    if (resolveLock) (resolveLock as () => void)();
    lockPromise = null;
  }
}

/**
 * Replaces the current database with a backup file.
 * Performs a safety backup of the current state first.
 */
export async function restoreBackup(backupFilePath: string): Promise<void> {
  if (isLocked) {
    throw new Error("Cannot restore: Database is currently locked (likely a backup in progress).");
  }

  // 1. Set lock to prevent any new queries
  let resolveLock: (() => void) | null = null;
  lockPromise = new Promise((resolve) => {
    resolveLock = resolve;
  });
  isLocked = true;

  try {
    // 2. Wait for current queries to finish
    while (activeQueries > 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 3. Perform safety backup before overwrite
    // We do this manually here because performBackup would try to manage its own lock
    const appDataPath = await appDataDir();
    const dbFilePath = await join(appDataPath, "cortex.db");
    
    if (await exists(dbFilePath)) {
      const safetyDir = await getDefaultBackupPath();
      if (!(await exists(safetyDir))) {
        await mkdir(safetyDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safetyPath = await join(safetyDir, `cortex_pre-restore-safety_${timestamp}.db`);
      await copyFile(dbFilePath, safetyPath);
    }

    // 4. Close connection
    if (dbInstance) {
      await dbInstance.close();
      dbInstance = null;
      dbPromise = null;
    }

    // 5. Overwrite database file
    await copyFile(backupFilePath, dbFilePath);
    
    console.log(`Database restored from: ${backupFilePath}`);

    // 6. Re-initialize database to ensure migrations/integrity
    await getDb();
    
  } catch (error) {
    console.error("Restore failed:", error);
    throw error;
  } finally {
    // 7. Release the lock
    isLocked = false;
    if (resolveLock) (resolveLock as () => void)();
    lockPromise = null;
  }
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
      city TEXT NOT NULL,
      show_birthday INTEGER DEFAULT 1,
      show_tax_id INTEGER DEFAULT 1
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
      overwritten_total REAL,
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
      console.error("Failed to fetch initial JVEG rates via Rust backend:", error);
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
    ['paymentReminderDays', '14'],
    ['submissionWarningDays', '14'],
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
    ['invoiceFileName', DEFAULT_INVOICE_FILE_NAME],
    ['jvegLastHash', ''],
    ['jvegLastCheckFailed', 'false'],
    ['backupLocation', ''],
    ['invoiceOutputLocation', ''],
    ['taxListingOutputLocation', ''],
    ['statusReportTemplate', `{{greeting}},


in der Betreuungssache betreffend {{formatName assignment.patientName includeTitles=false includeComma=false}} ({{assignment.fileNumber}}) teile ich Ihnen mit, dass das Gutachten voraussichtlich bis zum {{formattedSubmissionDate}} fertiggestellt wird.{{#if highWorkload}}

Für die lange Wartezeit ist das hohe Arbeitsaufkommen verantwortlich.{{/if}}{{#if explored}}

Die psychiatrische Exploration des Betroffenen hat bereits stattgefunden.{{/if}}


Mit freundlichen Grüßen


{{settings.userName}}`]
  ];

  for (const [key, value] of defaultSettings) {
    const exists = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM settings WHERE key = ?", [key]);
    if (exists[0].count === 0) {
      await db.execute("INSERT INTO settings (key, value) VALUES (?, ?)", [key, value]);
    }
  }

  // Add new columns if they don't exist
  try {
    await db.execute("ALTER TABLE assignments ADD COLUMN submission_date TEXT");
  } catch (e) {
    // Ignore error if column already exists
  }
  
  try {
    await db.execute("ALTER TABLE assignments ADD COLUMN started_working_date TEXT");
  } catch (e) {
    // Ignore error if column already exists
  }

  try {
    await db.execute("ALTER TABLE courts ADD COLUMN show_birthday INTEGER DEFAULT 1");
  } catch (e) {
    // Ignore
  }

  try {
    await db.execute("ALTER TABLE courts ADD COLUMN show_tax_id INTEGER DEFAULT 1");
  } catch (e) {
    // Ignore
  }

  try {
    await db.execute("ALTER TABLE assignments ADD COLUMN overwritten_total REAL");
  } catch (e) {
    // Ignore error if column already exists
  }
}
