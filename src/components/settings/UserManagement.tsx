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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="userName">Name</Label>
          <Input 
            id="userName" 
            value={settings.userName} 
            onChange={(e) => setSettings({ ...settings, userName: e.target.value })} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="userBirthday">Geburtsdatum</Label>
          <Input 
            id="userBirthday" 
            value={settings.userBirthday} 
            onChange={(e) => setSettings({ ...settings, userBirthday: e.target.value })} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="userStreet">Straße & Hausnummer</Label>
        <Input 
          id="userStreet" 
          value={settings.userStreet} 
          onChange={(e) => setSettings({ ...settings, userStreet: e.target.value })} 
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="userZip">PLZ</Label>
          <Input 
            id="userZip" 
            value={settings.userZip} 
            onChange={(e) => setSettings({ ...settings, userZip: e.target.value })} 
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="userCity">Ort</Label>
          <Input 
            id="userCity" 
            value={settings.userCity} 
            onChange={(e) => setSettings({ ...settings, userCity: e.target.value })} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="userTaxId">Steuernummer</Label>
        <Input 
          id="userTaxId" 
          value={settings.userTaxId} 
          onChange={(e) => setSettings({ ...settings, userTaxId: e.target.value })} 
        />
      </div>

      <div className="pt-4">
        <h4 className="text-sm font-medium mb-4">Gebühren & Sätze</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxRate">Umsatzsteuer (%)</Label>
            <Input 
              id="taxRate" 
              type="number"
              value={settings.taxRate} 
              onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kmFee">Kilometergeld (€/km)</Label>
            <Input 
              id="kmFee" 
              type="number"
              step="0.01"
              value={settings.kmFee} 
              onChange={(e) => setSettings({ ...settings, kmFee: parseFloat(e.target.value) })} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="writingFee">Schreibgebühr (€/1000 Zeichen)</Label>
            <Input 
              id="writingFee" 
              type="number"
              step="0.01"
              value={settings.writingFee} 
              onChange={(e) => setSettings({ ...settings, writingFee: parseFloat(e.target.value) })} 
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
