import { invoke } from "@tauri-apps/api/core";
import { SettingsService, RemunerationGroupService } from "./services";
import { parseHtmlForRates, hashString, ParsedRates } from "./jveg-parser";

export type { ParsedRates };

export const JvegService = {
  hashString,

  async checkForUpdates(): Promise<{ hasUpdates: boolean; jsonString?: string; error?: string }> {
    const settings = await SettingsService.getSettings();
    
    try {
      const jsonString = await invoke<string>("fetch_jveg");
      const hash = await this.hashString(jsonString);
      
      // Reset failed state if it was true
      if (settings.jvegLastCheckFailed === 'true') {
        await SettingsService.updateSettings({ ...settings, jvegLastCheckFailed: 'false' });
      }

      if (hash !== settings.jvegLastHash && settings.jvegLastHash !== '') {
        return { hasUpdates: true, jsonString };
      } else if (settings.jvegLastHash === '') {
        // First run: just save the hash
        await SettingsService.updateSettings({ ...settings, jvegLastHash: hash });
        return { hasUpdates: false };
      }
      
      return { hasUpdates: false };
    } catch (error: any) {
      if (settings.jvegLastCheckFailed !== 'true') {
        // First time failing
        await SettingsService.updateSettings({ ...settings, jvegLastCheckFailed: 'true' });
        return { hasUpdates: false, error: "Fehler beim Prüfen auf JVEG-Updates: " + error.toString() };
      }
      // Already failed before, don't show error again
      return { hasUpdates: false };
    }
  },

  parseHtmlForRates,
  
  async applyRates(rates: ParsedRates, jsonString: string): Promise<void> {
    const existingGroups = await RemunerationGroupService.getAll();
    for (const group of existingGroups) {
      const normalizedGroupName = group.name.replace(/\s+/g, '').toUpperCase();
      if (rates[normalizedGroupName]) {
        await RemunerationGroupService.update({ ...group, value: rates[normalizedGroupName] });
      }
    }
    
    const hash = await this.hashString(jsonString);
    const settings = await SettingsService.getSettings();
    await SettingsService.updateSettings({ ...settings, jvegLastHash: hash });
  }
};
