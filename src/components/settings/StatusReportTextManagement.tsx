import { useState, useEffect } from "react";
import { SettingsService } from "../../lib/services";
import { Settings } from "../../types";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Save } from "lucide-react";

export function StatusReportTextManagement() {
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
        className="flex min-h-[300px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        value={value || ""} 
        onChange={(e) => handleUpdate(id, e.target.value)} 
      />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <TextAreaField 
          id="statusReportTemplate" 
          label="Vorlage für die Sachstandsmitteilung" 
          value={settings.statusReportTemplate || ""} 
          help="Verwenden Sie Handlebars-Platzhalter wie {{greeting}}, {{formatName assignment.patientName includeTitles=false includeComma=false}}, {{#if highWorkload}}...{{/if}}."
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Sachstandsmitteilung speichern
        </Button>
      </div>
    </div>
  );
}
