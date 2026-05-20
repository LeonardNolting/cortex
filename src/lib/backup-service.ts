import { performBackup, getDb } from "./db";
import { appDataDir, documentDir, join } from "@tauri-apps/api/path";
import { readDir, remove, exists } from "@tauri-apps/plugin-fs";
import { SettingsService } from "./services";

const MAX_BACKUPS = 100;

export const BackupService = {
  /**
   * Initializes the backup schedule and runs the daily check.
   */
  async init() {
    console.log("Initializing Backup Service...");
    
    // 1. Run daily check
    await this.runDailyCheck();

    // 2. Setup hourly interval
    setInterval(() => {
      this.runHourlyBackup();
    }, 60 * 60 * 1000);
  },

  async runDailyCheck() {
    const db = await getDb();
    const lastDailyRow = await db.select<{ value: string }[]>("SELECT value FROM settings WHERE key = 'lastDailyBackup'");
    const lastDaily = lastDailyRow.length > 0 ? lastDailyRow[0].value : "";
    
    const today = new Date().toISOString().split('T')[0];
    
    if (lastDaily !== today) {
      console.log("Running daily backup...");
      try {
        await performBackup("daily");
        await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('lastDailyBackup', ?)", [today]);
        await this.rotateBackups();
      } catch (e) {
        console.error("Daily backup failed:", e);
      }
    }
  },

  async runHourlyBackup() {
    console.log("Running hourly backup...");
    try {
      await performBackup("hourly");
      await this.rotateBackups();
    } catch (e) {
      console.error("Hourly backup failed:", e);
    }
  },

  async runPreUpdateBackup() {
    console.log("Running pre-update backup...");
    try {
      await performBackup("pre-update");
      await this.rotateBackups();
    } catch (e) {
      console.error("Pre-update backup failed:", e);
    }
  },

  /**
   * Ensures only the last 100 backups are kept.
   */
  async rotateBackups() {
    try {
      const settings = await SettingsService.getSettings();
      let backupDir = settings.backupLocation;
      
      if (!backupDir) {
        const docDir = await documentDir();
        backupDir = await join(docDir, "cortex", "backups");
      }

      if (!(await exists(backupDir))) return;

      const entries = await readDir(backupDir);
      const backupFiles = entries
        .filter(e => e.isFile && e.name.startsWith("cortex_") && e.name.endsWith(".db"))
        .map(e => ({
          name: e.name,
          path: "", // Will be filled below
          mtime: 0 // Placeholder
        }));

      if (backupFiles.length <= MAX_BACKUPS) return;

      // We need to get modified times to delete the oldest
      // Note: Tauri's readDir in v2 provides metadata if requested, but for simplicity 
      // and since the filename contains a timestamp, we can sort by name (ISO date compatible)
      backupFiles.sort((a, b) => a.name.localeCompare(b.name));

      const toDelete = backupFiles.slice(0, backupFiles.length - MAX_BACKUPS);
      
      for (const file of toDelete) {
        const filePath = await join(backupDir, file.name);
        console.log(`Rotating backup: deleting ${file.name}`);
        await remove(filePath);
      }
    } catch (e) {
      console.error("Backup rotation failed:", e);
    }
  }
};
