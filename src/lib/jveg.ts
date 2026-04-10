import { SettingsService, RemunerationGroupService } from "./services";
import { RemunerationGroup } from "../types";

export interface ParsedRates {
  [key: string]: number; // e.g. "M 1": 80, "M 2": 90
}

export const JvegService = {
  async hashString(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async checkForUpdates(): Promise<{ hasUpdates: boolean; jsonString?: string; error?: string }> {
    const settings = await SettingsService.getSettings();
    
    try {
      const response = await fetch("https://gadi.netlify.app/laws/jveg.json");
      if (!response.ok) {
        throw new Error(`HTTP-Fehler! Status: ${response.status}`);
      }
      
      const jsonString = await response.text();
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
        return { hasUpdates: false, error: "Fehler beim Prüfen auf JVEG-Updates: " + error.message };
      }
      // Already failed before, don't show error again
      return { hasUpdates: false };
    }
  },

  parseHtmlForRates(jsonString: string): ParsedRates | null {
    try {
      const data = JSON.parse(jsonString);
      let extractedHtml = "";

      const traverse = (obj: any) => {
        if (typeof obj === "string" && (obj.includes("<table") || obj.includes("M 1") || obj.includes("M1"))) {
          extractedHtml += obj + "\\n";
        } else if (typeof obj === "object" && obj !== null) {
          for (const key in obj) {
            traverse(obj[key]);
          }
        }
      };

      traverse(data);

      if (!extractedHtml) return null;

      const parser = new DOMParser();
      // Wrap in a div to ensure it parses as HTML fragment correctly
      const doc = parser.parseFromString(`<div>${extractedHtml}</div>`, "text/html");
      const tables = doc.querySelectorAll("table");

      let rates: ParsedRates = {};
      
      tables.forEach(table => {
        const rows = table.querySelectorAll("tr");
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll("td, th"));
          if (cells.length >= 2) {
            const textContent = row.textContent || "";
            // Look for M1, M2, M3 in the row, allowing for space e.g., "M 1"
            const mMatch = textContent.match(/\\b(M\\s*[1-9])\\b/);
            if (mMatch) {
              const groupNameRaw = mMatch[1];
              // Normalize group name to "M1", "M2" etc.
              const groupName = groupNameRaw.replace(/\s+/g, '');
              
              // Find the last cell that contains a number
              for (let i = cells.length - 1; i >= 0; i--) {
                const cellText = (cells[i].textContent || "").trim();
                const numMatch = cellText.match(/^\\d+(?:,\\d+)?$/);
                if (numMatch) {
                  const val = parseFloat(numMatch[0].replace(',', '.'));
                  if (val > 0 && val < 1000) {
                    rates[groupName] = val;
                    break;
                  }
                }
              }
            }
          }
        });
      });

      // Require at least M1, M2, M3 to be confident in the parsing
      if (rates["M1"] && rates["M2"] && rates["M3"]) {
        return rates;
      }

      return null;
    } catch (e) {
      console.error("Error parsing JVEG HTML", e);
      return null;
    }
  },
  
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
