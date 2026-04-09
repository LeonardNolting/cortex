import { useState, useEffect } from "react";
import { SettingsService } from "../../lib/services";
import { Settings } from "../../types";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Save } from "lucide-react";

export function UserManagement() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await SettingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;
    try {
      await SettingsService.updateSettings(settings);
      // Optional: Show success message
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  }

  if (isLoading || !settings) {
    return <div>Lädt...</div>;
  }

  const updateNumericSetting = (key: keyof Settings, value: string) => {
    if (!settings) return;
    const numericValue = parseFloat(value.replace(",", "."));
    setSettings({
      ...settings,
      [key]: isNaN(numericValue) ? 0 : numericValue
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="userName">Name</Label>
          <Input 
            id="userName" 
            value={settings.userName || ""} 
            onChange={(e) => setSettings({ ...settings, userName: e.target.value })} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="userBirthday">Geburtsdatum</Label>
          <Input 
            id="userBirthday" 
            value={settings.userBirthday || ""} 
            onChange={(e) => setSettings({ ...settings, userBirthday: e.target.value })} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="userStreet">Straße & Hausnummer</Label>
        <Input 
          id="userStreet" 
          value={settings.userStreet || ""} 
          onChange={(e) => setSettings({ ...settings, userStreet: e.target.value })} 
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="userZip">PLZ</Label>
          <Input 
            id="userZip" 
            value={settings.userZip || ""} 
            onChange={(e) => setSettings({ ...settings, userZip: e.target.value })} 
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="userCity">Ort</Label>
          <Input 
            id="userCity" 
            value={settings.userCity || ""} 
            onChange={(e) => setSettings({ ...settings, userCity: e.target.value })} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="userTaxId">Steuernummer</Label>
        <Input 
          id="userTaxId" 
          value={settings.userTaxId || ""} 
          onChange={(e) => setSettings({ ...settings, userTaxId: e.target.value })} 
        />
      </div>

      <div className="pt-4">
        <h4 className="text-sm font-medium mb-4">Bankverbindung</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userBank">Bank</Label>
            <Input 
              id="userBank" 
              value={settings.userBank || ""} 
              onChange={(e) => setSettings({ ...settings, userBank: e.target.value })} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userIban">IBAN</Label>
              <Input 
                id="userIban" 
                value={settings.userIban || ""} 
                onChange={(e) => setSettings({ ...settings, userIban: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userBic">BIC</Label>
              <Input 
                id="userBic" 
                value={settings.userBic || ""} 
                onChange={(e) => setSettings({ ...settings, userBic: e.target.value })} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <h4 className="text-sm font-medium mb-4">Gebühren & Sätze</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxRate">Umsatzsteuer (%)</Label>
            <Input 
              id="taxRate" 
              type="number"
              step="any"
              value={settings.taxRate ?? 0} 
              onChange={(e) => updateNumericSetting("taxRate", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kmFee">Kilometergeld (€/km)</Label>
            <Input 
              id="kmFee" 
              type="number"
              step="any"
              value={settings.kmFee ?? 0} 
              onChange={(e) => updateNumericSetting("kmFee", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="writingFee">Schreibgebühr (€/1000 Zeichen)</Label>
            <Input 
              id="writingFee" 
              type="number"
              step="any"
              value={settings.writingFee ?? 0} 
              onChange={(e) => updateNumericSetting("writingFee", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="printingFee">Kopierkosten (€/Seite)</Label>
            <Input 
              id="printingFee" 
              type="number"
              step="any"
              value={settings.printingFee ?? 0} 
              onChange={(e) => updateNumericSetting("printingFee", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentDeadlineDays">Zahlungsfrist (Tage)</Label>
            <Input 
              id="paymentDeadlineDays" 
              type="number"
              step="1"
              value={settings.paymentDeadlineDays ?? 14} 
              onChange={(e) => updateNumericSetting("paymentDeadlineDays", e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Benutzerdaten speichern
        </Button>
      </div>
    </div>
  );
}
