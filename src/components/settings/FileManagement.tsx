import { useState, useEffect } from "react";
import { SettingsService } from "../../lib/services";
import { Settings } from "../../types";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Save, FolderSearch, ExternalLink } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { openPath } from "@tauri-apps/plugin-opener";
import { documentDir } from "@tauri-apps/api/path";

export function FileManagement() {
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

  const DirectoryPickerField = ({ id, label, value }: { id: keyof Settings, label: string, value: string }) => {
    const handlePickDirectory = async () => {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Verzeichnis auswählen",
      });
      if (selected !== null) {
        handleUpdate(id, selected as string);
      }
    };

    const handleOpenDirectory = async () => {
      try {
        const dirToOpen = value || await documentDir();
        await openPath(dirToOpen);
      } catch (error) {
        console.error("Failed to open directory", error);
      }
    };

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <div 
            className="flex-1 px-3 py-2 bg-muted/50 text-sm rounded-md truncate border border-transparent"
            title={value || "Standard-Dokumentenordner"}
          >
            {value || <span className="text-muted-foreground italic">Standard-Dokumentenordner</span>}
          </div>
          <Button variant="outline" size="icon" onClick={handlePickDirectory} title="Ordner ändern">
            <FolderSearch className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleOpenDirectory} title="Im System-Explorer öffnen">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <DirectoryPickerField
            id="invoiceOutputLocation"
            label="Ausgabeverzeichnis für Rechnungen"
            value={settings.invoiceOutputLocation}
        />
        <DirectoryPickerField
            id="taxListingOutputLocation"
            label="Ausgabeverzeichnis für Einnahmenübersicht"
            value={settings.taxListingOutputLocation}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Dateiverwaltung speichern
        </Button>
      </div>
    </div>
  );
}
