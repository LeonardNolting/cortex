import { useState, useEffect } from "react";
import { SettingsService } from "../../lib/services";
import { Settings } from "../../types";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Save } from "lucide-react";

export function InvoiceTextManagement() {
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
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  }

  if (isLoading || !settings) {
    return <div>Lädt...</div>;
  }

  const handleUpdate = (key: keyof Settings, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: value
    });
  };

  const TextAreaField = ({ id, label, value, help }: { id: keyof Settings, label: string, value: string, help?: string }) => (
    <div className="space-y-2">
      <Label htmlFor={String(id)}>{label}</Label>
      <textarea 
        id={String(id)} 
        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        value={value || ""} 
        onChange={(e) => handleUpdate(id, e.target.value)} 
      />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );

  const InputField = ({ id, label, value }: { id: keyof Settings, label: string, value: string }) => (
    <div className="space-y-2">
      <Label htmlFor={String(id)}>{label}</Label>
      <Input 
        id={String(id)} 
        value={value || ""} 
        onChange={(e) => handleUpdate(id, e.target.value)} 
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium border-b pb-2">Allgemein</h4>
        <TextAreaField 
          id="invoiceIntro" 
          label="Einleitungstext" 
          value={settings.invoiceIntro} 
          help="Verwenden Sie Handlebars-Platzhalter wie {{remunerationGroup.name}}."
        />
        <InputField 
          id="invoiceSubject" 
          label="Betreffzeile" 
          value={settings.invoiceSubject} 
        />
        <InputField 
          id="invoiceTitle" 
          label="Überschrift" 
          value={settings.invoiceTitle} 
        />
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium border-b pb-2">Tabelle Labels</h4>
        <div className="grid grid-cols-2 gap-4">
          <InputField id="invoiceLabelTravelSingle" label="Anfahrt (einfach)" value={settings.invoiceLabelTravelSingle} />
          <InputField id="invoiceLabelTravelMultiple" label="Anfahrten (mehrfach)" value={settings.invoiceLabelTravelMultiple} />
        </div>
        <TextAreaField id="invoiceLabelPreparation" label="Vorbereitung" value={settings.invoiceLabelPreparation} />
        <TextAreaField id="invoiceLabelEvaluation" label="Auswertung/Schreiben" value={settings.invoiceLabelEvaluation} />
        <div className="grid grid-cols-2 gap-4">
          <InputField id="invoiceLabelTotalTime" label="Gesamtzeit" value={settings.invoiceLabelTotalTime} />
          <InputField id="invoiceLabelWriting" label="Schreibgebühr" value={settings.invoiceLabelWriting} />
          <InputField id="invoiceLabelKm" label="Kilometerpauschale" value={settings.invoiceLabelKm} />
          <InputField id="invoiceLabelPrinting" label="Kopierkosten" value={settings.invoiceLabelPrinting} />
          <InputField id="invoiceLabelShipping" label="Versandkosten" value={settings.invoiceLabelShipping} />
          <InputField id="invoiceLabelNet" label="Gesamt (Netto)" value={settings.invoiceLabelNet} />
          <InputField id="invoiceLabelTax" label="Umsatzsteuer" value={settings.invoiceLabelTax} />
          <InputField id="invoiceLabelGross" label="Gesamt (Brutto)" value={settings.invoiceLabelGross} />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium border-b pb-2">Fußzeile</h4>
        <TextAreaField 
          id="invoiceFooter" 
          label="Abschluss / Bankverbindung" 
          value={settings.invoiceFooter} 
          help="Verwenden Sie Handlebars-Platzhalter wie {{settings.userBank}}."
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Rechnungstexte speichern
        </Button>
      </div>
    </div>
  );
}
