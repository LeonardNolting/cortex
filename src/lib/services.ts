import { getDb } from "./db";
import { Court, RemunerationGroup, Settings } from "../types";

export const SettingsService = {
  async getSettings(): Promise<Settings> {
    const db = await getDb();
    const rows = await db.select<{ key: string; value: string }[]>("SELECT * FROM settings");
    
    const settings: Partial<Settings> = {};
    for (const row of rows) {
      if (['taxRate', 'kmFee', 'writingFee', 'printingFee'].includes(row.key)) {
        const val = parseFloat(row.value);
        settings[row.key as keyof Settings] = (isNaN(val) ? 0 : val) as any;
      } else {
        settings[row.key as keyof Settings] = row.value as any;
      }
    }
    
    return settings as Settings;
  },

  async updateSettings(settings: Settings): Promise<void> {
    const db = await getDb();
    for (const [key, value] of Object.entries(settings)) {
      await db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        [key, value.toString()]
      );
    }
  }
};

export const CourtService = {
  async getAll(): Promise<Court[]> {
    const db = await getDb();
    return db.select<Court[]>("SELECT * FROM courts ORDER BY name ASC");
  },

  async getById(id: number): Promise<Court | null> {
    const db = await getDb();
    const results = await db.select<Court[]>("SELECT * FROM courts WHERE id = ?", [id]);
    return results.length > 0 ? results[0] : null;
  },

  async create(court: Omit<Court, "id">): Promise<void> {
    const db = await getDb();
    await db.execute(
      "INSERT INTO courts (name, department, street, zip, city) VALUES (?, ?, ?, ?, ?)",
      [court.name, court.department, court.street, court.zip, court.city]
    );
  },

  async update(court: Court): Promise<void> {
    const db = await getDb();
    await db.execute(
      "UPDATE courts SET name = ?, department = ?, street = ?, zip = ?, city = ? WHERE id = ?",
      [court.name, court.department, court.street, court.zip, court.city, court.id]
    );
  },

  async delete(id: number): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM courts WHERE id = ?", [id]);
  }
};

export const RemunerationGroupService = {
  async getAll(): Promise<RemunerationGroup[]> {
    const db = await getDb();
    return db.select<RemunerationGroup[]>("SELECT * FROM remuneration_groups ORDER BY name ASC");
  },

  async getById(id: number): Promise<RemunerationGroup | null> {
    const db = await getDb();
    const results = await db.select<RemunerationGroup[]>("SELECT * FROM remuneration_groups WHERE id = ?", [id]);
    return results.length > 0 ? results[0] : null;
  },

  async create(group: Omit<RemunerationGroup, "id">): Promise<void> {
    const db = await getDb();
    await db.execute(
      "INSERT INTO remuneration_groups (name, value) VALUES (?, ?)",
      [group.name, group.value]
    );
  },

  async update(group: RemunerationGroup): Promise<void> {
    const db = await getDb();
    await db.execute(
      "UPDATE remuneration_groups SET name = ?, value = ? WHERE id = ?",
      [group.name, group.value, group.id]
    );
  },

  async delete(id: number): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM remuneration_groups WHERE id = ?", [id]);
  }
};

export const AssignmentService = {
  async getAll(): Promise<Assignment[]> {
    const db = await getDb();
    return db.select<Assignment[]>(`
      SELECT 
        a.id, 
        a.invoice_number as invoiceNumber, 
        a.patient_name as patientName, 
        a.patient_birthdate as patientBirthdate, 
        a.file_number as fileNumber, 
        a.court_id as courtId, 
        a.remuneration_group_id as remunerationGroupId, 
        a.travel_time as travelTime, 
        a.preparation_time as preparationTime, 
        a.evaluation_time as evaluationTime, 
        a.writing_characters as writingCharacters, 
        a.printing_pages as printingPages, 
        a.km_count as kmCount, 
        a.shipping_fee as shippingFee, 
        a.status, 
        a.created_at as createdAt,
        a.printing_date as printingDate,
        c.name as court,
        rg.name as remunerationGroup
      FROM assignments a
      JOIN courts c ON a.court_id = c.id
      JOIN remuneration_groups rg ON a.remuneration_group_id = rg.id
      ORDER BY a.created_at DESC
    `);
  },

  async getById(id: number): Promise<Assignment | null> {
    const db = await getDb();
    const results = await db.select<Assignment[]>(`
      SELECT 
        a.id, 
        a.invoice_number as invoiceNumber, 
        a.patient_name as patientName, 
        a.patient_birthdate as patientBirthdate, 
        a.file_number as fileNumber, 
        a.court_id as courtId, 
        a.remuneration_group_id as remunerationGroupId, 
        a.travel_time as travelTime, 
        a.preparation_time as preparationTime, 
        a.evaluation_time as evaluationTime, 
        a.writing_characters as writingCharacters, 
        a.printing_pages as printingPages, 
        a.km_count as kmCount, 
        a.shipping_fee as shippingFee, 
        a.status, 
        a.created_at as createdAt,
        a.printing_date as printingDate,
        c.name as court,
        rg.name as remunerationGroup
      FROM assignments a
      JOIN courts c ON a.court_id = c.id
      JOIN remuneration_groups rg ON a.remuneration_group_id = rg.id
      WHERE a.id = ?
    `, [id]);
    return results.length > 0 ? results[0] : null;
  },

  async create(assignment: Partial<Assignment>): Promise<number> {
    const db = await getDb();
    const result = await db.execute(
      `INSERT INTO assignments (
        invoice_number, patient_name, patient_birthdate, file_number, court_id, remuneration_group_id,
        travel_time, preparation_time, evaluation_time, writing_characters, 
        printing_pages, km_count, shipping_fee, status, printing_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assignment.invoiceNumber || null,
        assignment.patientName, assignment.patientBirthdate, assignment.fileNumber, 
        assignment.courtId, assignment.remunerationGroupId,
        assignment.travelTime || 0, assignment.preparationTime || 0, assignment.evaluationTime || 0, 
        assignment.writingCharacters || 0, assignment.printingPages || 0, 
        assignment.kmCount || 0, assignment.shippingFee || 0, 
        assignment.status || 'Offen',
        assignment.printingDate || null
      ]
    );
    return result.lastInsertId;
  },

  async update(assignment: Assignment): Promise<void> {
    const db = await getDb();
    await db.execute(
      `UPDATE assignments SET 
        invoice_number = ?, patient_name = ?, patient_birthdate = ?, file_number = ?, 
        court_id = ?, remuneration_group_id = ?,
        travel_time = ?, preparation_time = ?, evaluation_time = ?, 
        writing_characters = ?, printing_pages = ?, km_count = ?, 
        shipping_fee = ?, status = ?, printing_date = ?
      WHERE id = ?`,
      [
        assignment.invoiceNumber || null,
        assignment.patientName, assignment.patientBirthdate, assignment.fileNumber, 
        assignment.courtId, assignment.remunerationGroupId,
        assignment.travelTime, assignment.preparationTime, assignment.evaluationTime, 
        assignment.writingCharacters, assignment.printingPages, 
        assignment.kmCount, assignment.shippingFee, assignment.status, 
        assignment.printingDate || null,
        assignment.id
      ]
    );
  },

  async delete(id: number): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM assignments WHERE id = ?", [id]);
  }
};
