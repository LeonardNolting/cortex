import { useState, useEffect } from "react";
import { SettingsService } from "../../lib/services";
import { Settings } from "../../types";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Save } from "lucide-react";

type UserSettingsFormData = Omit<Settings, 'taxRate' | 'kmFee' | 'writingFee' | 'printingFee' | 'paymentDeadlineDays'> & {
  taxRate: string;
  kmFee: string;
  writingFee: string;
  printingFee: string;
  paymentDeadlineDays: string;
};

export function UserManagement() {
  const [settings, setSettings] = useState<UserSettingsFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await SettingsService.getSettings();
      setSettings({
        ...data,
        taxRate: String(data.taxRate || '0').replace('.', ','),
        kmFee: String(data.kmFee || '0').replace('.', ','),
        writingFee: String(data.writingFee || '0').replace('.', ','),
        printingFee: String(data.printingFee || '0').replace('.', ','),
        paymentDeadlineDays: String(data.paymentDeadlineDays || '14').replace('.', ','),
      });
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

    const parseGermanNumber = (str: string) => {
      const value = parseFloat(str.replace(',', '.'));
      return isNaN(value) ? 0 : value;
    }

    const settingsToSave: Settings = {
      ...settings,
      taxRate: parseGermanNumber(settings.taxRate),
      kmFee: parseGermanNumber(settings.kmFee),
      writingFee: parseGermanNumber(settings.writingFee),
      printingFee: parseGermanNumber(settings.printingFee),
      paymentDeadlineDays: parseGermanNumber(settings.paymentDeadlineDays),
    };

    try {
      await SettingsService.updateSettings(settingsToSave);
      // Optional: Show success message
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    const { name, value } = e.target;
    
    const numericFields = ["taxRate", "kmFee", "writingFee", "printingFee", "paymentDeadlineDays"];

    if (numericFields.includes(name)) {
      const sanitizedValue = value.replace('.',',');
      if (sanitizedValue === "" || /^[0-9]*\,?[0-9]*$/.test(sanitizedValue)) {
        setSettings(prev => ({ ...prev!, [name]: sanitizedValue }));
      }
    } else {
      setSettings(prev => ({ ...prev!, [name]: value }));
    }
  };


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
            name="userName"
            value={settings.userName || ""} 
            onChange={handleChange} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="userBirthday">Geburtsdatum</Label>
          <Input 
            id="userBirthday" 
            name="userBirthday"
            value={settings.userBirthday || ""} 
            onChange={handleChange} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="userStreet">Straße & Hausnummer</Label>
        <Input 
          id="userStreet" 
          name="userStreet"
          value={settings.userStreet || ""} 
          onChange={handleChange} 
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="userZip">PLZ</Label>
          <Input 
            id="userZip" 
            name="userZip"
            value={settings.userZip || ""} 
            onChange={handleChange} 
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="userCity">Ort</Label>
          <Input 
            id="userCity" 
            name="userCity"
            value={settings.userCity || ""} 
            onChange={handleChange} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="userTaxId">Steuernummer</Label>
        <Input 
          id="userTaxId" 
          name="userTaxId"
          value={settings.userTaxId || ""} 
          onChange={handleChange} 
        />
      </div>

      <div className="pt-4">
        <h4 className="text-sm font-medium mb-4">Bankverbindung</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userBank">Bank</Label>
            <Input 
              id="userBank" 
              name="userBank"
              value={settings.userBank || ""} 
              onChange={handleChange} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userIban">IBAN</Label>
              <Input 
                id="userIban" 
                name="userIban"
                value={settings.userIban || ""} 
                onChange={handleChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userBic">BIC</Label>
              <Input 
                id="userBic" 
                name="userBic"
                value={settings.userBic || ""} 
                onChange={handleChange} 
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
              name="taxRate"
              type="text"
              inputMode="decimal"
              value={settings.taxRate} 
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kmFee">Kilometergeld (€/km)</Label>
            <Input 
              id="kmFee"
              name="kmFee" 
              type="text"
              inputMode="decimal"
              value={settings.kmFee} 
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="writingFee">Schreibgebühr (€/1000 Zeichen)</Label>
            <Input 
              id="writingFee" 
              name="writingFee"
              type="text"
              inputMode="decimal"
              value={settings.writingFee} 
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="printingFee">Kopierkosten (€/Seite)</Label>
            <Input 
              id="printingFee" 
              name="printingFee"
              type="text"
              inputMode="decimal"
              value={settings.printingFee} 
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentDeadlineDays">Zahlungsfrist (Tage)</Label>
            <Input 
              id="paymentDeadlineDays" 
              name="paymentDeadlineDays"
              type="text"
              inputMode="decimal"
              value={settings.paymentDeadlineDays} 
              onChange={handleChange}
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
