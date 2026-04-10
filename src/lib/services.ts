import { getDb } from "./db";
import {Assignment, Court, RemunerationGroup, Settings} from "../types";

export const SettingsService = {
  async getSettings(): Promise<Settings> {
    const db = await getDb();
    const rows = await db.select<{ key: string; value: string }[]>("SELECT * FROM settings");
    
    const settings: any = {};
    for (const row of rows) {
      if (['taxRate', 'kmFee', 'writingFee', 'printingFee', 'paymentDeadlineDays', 'submissionWarningDays'].includes(row.key)) {
        const val = parseFloat(row.value);
        settings[row.key] = isNaN(val) ? 0 : val;
      } else {
        settings[row.key] = row.value;
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
    const rows = await db.select<any[]>(`
      SELECT 
        a.id, 
        a.invoice_number as invoiceNumber, 
        a.patient_name as patientName, 
        a.patient_birthdate as patientBirthdate, 
        a.file_number as fileNumber, 
        a.court_id as courtId, 
        a.remuneration_group_id as remunerationGroupId, 
        a.travel_time as travelTime, 
        a.travel_count as travelCount,
        a.preparation_time as preparationTime, 
        a.evaluation_time as evaluationTime, 
        a.writing_characters as writingCharacters, 
        a.printing_pages as printingPages, 
        a.km_count as kmCount, 
        a.shipping_fee as shippingFee, 
        a.created_at as createdAt,
        a.printing_date as printingDate,
        a.paid_at as paidAt,
        a.submission_date as submissionDate,
        a.started_working_date as startedWorkingDate,
        a.total_minutes as totalMinutes,
        a.rounded_minutes as roundedMinutes,
        a.time_euro as timeEuro,
        a.writing_euro as writingEuro,
        a.printing_euro as printingEuro,
        a.km_euro as kmEuro,
        a.shipping_euro as shippingEuro,
        a.net_euro as netEuro,
        a.tax_euro as taxEuro,
        a.gross_euro as grossEuro,
        a.remuneration_group_value as remunerationGroupValue,
        a.writing_fee_rate as writingFeeRate,
        a.printing_fee_rate as printingFeeRate,
        a.km_fee_rate as kmFeeRate,
        a.tax_rate as taxRate,
        c.name as court,
        rg.name as remunerationGroup
      FROM assignments a
      JOIN courts c ON a.court_id = c.id
      JOIN remuneration_groups rg ON a.remuneration_group_id = rg.id
      ORDER BY a.created_at DESC
    `);
    return rows;
  },

  async getById(id: number): Promise<Assignment | null> {
    const db = await getDb();
    const results = await db.select<any[]>(`
      SELECT 
        a.id, 
        a.invoice_number as invoiceNumber, 
        a.patient_name as patientName, 
        a.patient_birthdate as patientBirthdate, 
        a.file_number as fileNumber, 
        a.court_id as courtId, 
        a.remuneration_group_id as remunerationGroupId, 
        a.travel_time as travelTime, 
        a.travel_count as travelCount,
        a.preparation_time as preparationTime, 
        a.evaluation_time as evaluationTime, 
        a.writing_characters as writingCharacters, 
        a.printing_pages as printingPages, 
        a.km_count as kmCount, 
        a.shipping_fee as shippingFee, 
        a.created_at as createdAt,
        a.printing_date as printingDate,
        a.paid_at as paidAt,
        a.submission_date as submissionDate,
        a.started_working_date as startedWorkingDate,
        a.total_minutes as totalMinutes,
        a.rounded_minutes as roundedMinutes,
        a.time_euro as timeEuro,
        a.writing_euro as writingEuro,
        a.printing_euro as printingEuro,
        a.km_euro as kmEuro,
        a.shipping_euro as shippingEuro,
        a.net_euro as netEuro,
        a.tax_euro as taxEuro,
        a.gross_euro as grossEuro,
        a.remuneration_group_value as remunerationGroupValue,
        a.writing_fee_rate as writingFeeRate,
        a.printing_fee_rate as printingFeeRate,
        a.km_fee_rate as kmFeeRate,
        a.tax_rate as taxRate,
        c.name as court,
        rg.name as remunerationGroup
      FROM assignments a
      JOIN courts c ON a.court_id = c.id
      JOIN remuneration_groups rg ON a.remuneration_group_id = rg.id
      WHERE a.id = ?
    `, [id]);
    if (results.length === 0) return null;
    return results[0] as Assignment;
  },

  async getNextInvoiceNumber(): Promise<string> {
    const db = await getDb();
    const now = new Date();
    const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const prefix = `ZZK${yearMonth}`;
    
    // Find the highest invoice number for this month
    const results = await db.select<{ invoiceNumber: string }[]>(
      "SELECT invoice_number as invoiceNumber FROM assignments WHERE invoice_number LIKE ? ORDER BY invoice_number DESC LIMIT 1",
      [`${prefix}%`]
    );
    
    let nextIndex = 1;
    if (results.length > 0 && results[0].invoiceNumber) {
      const lastInvoice = results[0].invoiceNumber;
      const lastIndexStr = lastInvoice.slice(-2);
      const lastIndex = parseInt(lastIndexStr, 10);
      if (!isNaN(lastIndex)) {
        nextIndex = lastIndex + 1;
      }
    }
    
    return `${prefix}${nextIndex.toString().padStart(2, '0')}`;
  },

  async create(assignment: Partial<Assignment>): Promise<number> {
    const db = await getDb();
    const result = await db.execute(
      `INSERT INTO assignments (
        invoice_number, patient_name, patient_birthdate, file_number, court_id, remuneration_group_id,
        travel_time, travel_count, preparation_time, evaluation_time, writing_characters,
        printing_pages, km_count, shipping_fee, printing_date, paid_at,
        submission_date, started_working_date,
        total_minutes, rounded_minutes, time_euro, writing_euro, printing_euro,
        km_euro, shipping_euro, net_euro, tax_euro, gross_euro,
        remuneration_group_value, writing_fee_rate, printing_fee_rate, km_fee_rate, tax_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assignment.invoiceNumber || null,
        assignment.patientName, assignment.patientBirthdate, assignment.fileNumber,
        assignment.courtId, assignment.remunerationGroupId,
        assignment.travelTime || 0, assignment.travelCount || 1, assignment.preparationTime || 0, assignment.evaluationTime || 0,
        assignment.writingCharacters || 0, assignment.printingPages || 0,
        assignment.kmCount || 0, assignment.shippingFee || 0,
        assignment.printingDate || null,
        assignment.paidAt || null,
        assignment.submissionDate || null,
        assignment.startedWorkingDate || null,
        assignment.totalMinutes || null, assignment.roundedMinutes || null, assignment.timeEuro || null,        assignment.writingEuro || null, assignment.printingEuro || null,
        assignment.kmEuro || null, assignment.shippingEuro || null, assignment.netEuro || null, 
        assignment.taxEuro || null, assignment.grossEuro || null,
        assignment.remunerationGroupValue || null,
        assignment.writingFeeRate || null,
        assignment.printingFeeRate || null,
        assignment.kmFeeRate || null,
        assignment.taxRate || null
      ]
    );
    return result.lastInsertId!;
  },

  async update(assignment: Assignment): Promise<void> {
    const db = await getDb();
    await db.execute(
      `UPDATE assignments SET 
        invoice_number = ?, patient_name = ?, patient_birthdate = ?, file_number = ?, 
        court_id = ?, remuneration_group_id = ?,
        travel_time = ?, travel_count = ?, preparation_time = ?, evaluation_time = ?, 
        writing_characters = ?, printing_pages = ?, km_count = ?, 
        shipping_fee = ?, printing_date = ?, paid_at = ?,
        submission_date = ?, started_working_date = ?,
        total_minutes = ?, rounded_minutes = ?, time_euro = ?, writing_euro = ?, printing_euro = ?,
        km_euro = ?, shipping_euro = ?, net_euro = ?, tax_euro = ?, gross_euro = ?,
        remuneration_group_value = ?, writing_fee_rate = ?, printing_fee_rate = ?, km_fee_rate = ?, tax_rate = ?
        WHERE id = ?`,
        [
        assignment.invoiceNumber || null,
        assignment.patientName, assignment.patientBirthdate, assignment.fileNumber, 
        assignment.courtId, assignment.remunerationGroupId,
        assignment.travelTime, assignment.travelCount || 1, assignment.preparationTime, assignment.evaluationTime, 
        assignment.writingCharacters, assignment.printingPages, 
        assignment.kmCount, assignment.shippingFee, 
        assignment.printingDate || null,
        assignment.paidAt || null,
        assignment.submissionDate || null,
        assignment.startedWorkingDate || null,
        assignment.totalMinutes ?? null, assignment.roundedMinutes ?? null, assignment.timeEuro ?? null, 
        assignment.writingEuro ?? null, assignment.printingEuro ?? null,
        assignment.kmEuro ?? null, assignment.shippingEuro ?? null, assignment.netEuro ?? null, 
        assignment.taxEuro ?? null, assignment.grossEuro ?? null,
        assignment.remunerationGroupValue ?? null,
        assignment.writingFeeRate ?? null,
        assignment.printingFeeRate ?? null,
        assignment.kmFeeRate ?? null,
        assignment.taxRate ?? null,
        assignment.id
        ]
    );
  },

  async delete(id: number): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM assignments WHERE id = ?", [id]);
  },

  async getPaidByMonth(month: number, year: number): Promise<Assignment[]> {
    const db = await getDb();
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString();
    const pattern = `${yearStr}-${monthStr}-%`;
    
    const rows = await db.select<any[]>(`
      SELECT 
        a.id, 
        a.invoice_number as invoiceNumber, 
        a.patient_name as patientName, 
        a.patient_birthdate as patientBirthdate, 
        a.file_number as fileNumber, 
        a.court_id as courtId, 
        a.remuneration_group_id as remunerationGroupId, 
        a.travel_time as travelTime, 
        a.travel_count as travelCount,
        a.preparation_time as preparationTime, 
        a.evaluation_time as evaluationTime, 
        a.writing_characters as writingCharacters, 
        a.printing_pages as printingPages, 
        a.km_count as kmCount, 
        a.shipping_fee as shippingFee, 
        a.created_at as createdAt,
        a.printing_date as printingDate,
        a.paid_at as paidAt,
        a.submission_date as submissionDate,
        a.started_working_date as startedWorkingDate,
        a.total_minutes as totalMinutes,
        a.rounded_minutes as roundedMinutes,
        a.time_euro as timeEuro,
        a.writing_euro as writingEuro,
        a.printing_euro as printingEuro,
        a.km_euro as kmEuro,
        a.shipping_euro as shippingEuro,
        a.net_euro as netEuro,
        a.tax_euro as taxEuro,
        a.gross_euro as grossEuro,
        a.remuneration_group_value as remunerationGroupValue,
        a.writing_fee_rate as writingFeeRate,
        a.printing_fee_rate as printingFeeRate,
        a.km_fee_rate as kmFeeRate,
        a.tax_rate as taxRate,
        c.name as court,
        rg.name as remunerationGroup
      FROM assignments a
      JOIN courts c ON a.court_id = c.id
      JOIN remuneration_groups rg ON a.remuneration_group_id = rg.id
      WHERE a.paid_at LIKE ?
      ORDER BY a.paid_at ASC
    `, [pattern]);
    
    return rows;
  }
};
