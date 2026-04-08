import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  db = await Database.load("sqlite:cortex.db");
  await runMigrations(db);
  return db;
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
      preparation_time INTEGER DEFAULT 0,
      evaluation_time INTEGER DEFAULT 0,
      writing_characters INTEGER DEFAULT 0,
      printing_pages INTEGER DEFAULT 0,
      km_count REAL DEFAULT 0,
      shipping_fee REAL DEFAULT 0,
      status TEXT DEFAULT 'Offen',
      created_at TEXT DEFAULT (datetime('now')),
      printing_date TEXT,
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
    await db.execute(`
      INSERT INTO remuneration_groups (name, value)
      VALUES ('M1', 80), ('M2', 90), ('M3', 120)
    `);
  }

  // Default entries for settings
  const defaultSettings = [
    ['userName', 'Dr. Max Mustermann'],
    ['userBirthday', '01.01.1970'],
    ['userStreet', 'Musterstraße 123'],
    ['userZip', '12345'],
    ['userCity', 'Musterstadt'],
    ['userTaxId', 'DE 123 456 789'],
    ['taxRate', '19'],
    ['kmFee', '0.42'],
    ['writingFee', '1.5'],
    ['printingFee', '0.5']
  ];

  for (const [key, value] of defaultSettings) {
    const exists = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM settings WHERE key = ?", [key]);
    if (exists[0].count === 0) {
      await db.execute("INSERT INTO settings (key, value) VALUES (?, ?)", [key, value]);
    }
  }
}
