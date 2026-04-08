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
