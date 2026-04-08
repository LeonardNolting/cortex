import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Save } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { CourtManagement } from "../components/settings/CourtManagement";
import { RemunerationGroupManagement } from "../components/settings/RemunerationGroupManagement";
import { UserManagement } from "../components/settings/UserManagement";

export function SettingsScreen() {
  const navigate = useNavigate();

  const actions = (
    <Button onClick={() => navigate("/")}>
      <Save className="mr-2 h-4 w-4" />
      Speichern
    </Button>
  );

  return (
    <>
      <PageHeader 
        title="Einstellungen" 
        description="Globale Daten und Rechnungstexte verwalten"
        actions={actions}
        showBack={true}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Benutzerdaten</CardTitle>
            <CardDescription>Name, Adresse und Steuernummer des Gutachters.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserManagement />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Gerichte & Sätze</CardTitle>
            <CardDescription>Verwalten Sie Gerichte und Vergütungsgruppen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <CourtManagement />
            <RemunerationGroupManagement />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Rechnungstexte</CardTitle>
            <CardDescription>Standardformulierungen für die DOCX-Erstellung.</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
            [Platzhalter: Rechnungsvorlagen / Texte]
          </CardContent>
        </Card>
      </div>
    </>
  );
}
