import { useState, useEffect } from "react";
import { SettingsService } from "../../lib/services";
import { Settings } from "../../types";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Save } from "lucide-react";
import { formatToGermanString, parseGermanNumber } from "../../lib/number-format";
import { NumericInput } from "../ui/numeric-input";

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
        taxRate: formatToGermanString(data.taxRate),
        kmFee: formatToGermanString(data.kmFee),
        writingFee: formatToGermanString(data.writingFee),
        printingFee: formatToGermanString(data.printingFee),
        paymentDeadlineDays: formatToGermanString(data.paymentDeadlineDays),
      });
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

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
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev!, [name]: value }));
  };

  const handleNumericChange = (name: keyof UserSettingsFormData) => (value: string) => {
    setSettings(prev => ({ ...prev!, [name]: value }));
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
            <NumericInput 
              id="taxRate" 
              name="taxRate"
              value={settings.taxRate} 
              onValueChange={handleNumericChange("taxRate")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kmFee">Kilometergeld (€/km)</Label>
            <NumericInput 
              id="kmFee"
              name="kmFee" 
              value={settings.kmFee} 
              onValueChange={handleNumericChange("kmFee")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="writingFee">Schreibgebühr (€/1000 Zeichen)</Label>
            <NumericInput 
              id="writingFee" 
              name="writingFee"
              value={settings.writingFee} 
              onValueChange={handleNumericChange("writingFee")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="printingFee">Kopierkosten (€/Seite)</Label>
            <NumericInput 
              id="printingFee" 
              name="printingFee"
              value={settings.printingFee} 
              onValueChange={handleNumericChange("printingFee")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentDeadlineDays">Zahlungsfrist (Tage)</Label>
            <NumericInput 
              id="paymentDeadlineDays" 
              name="paymentDeadlineDays"
              value={settings.paymentDeadlineDays} 
              onValueChange={handleNumericChange("paymentDeadlineDays")}
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
