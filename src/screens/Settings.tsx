import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Save } from "lucide-react";

export function SettingsScreen() {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
            <p className="text-muted-foreground">Globale Daten und Rechnungstexte verwalten</p>
          </div>
        </div>
        <Button onClick={() => navigate("/")}>
          <Save className="mr-2 h-4 w-4" />
          Speichern
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Benutzerdaten</CardTitle>
            <CardDescription>Name, Adresse und Steuernummer des Gutachters.</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
            [Platzhalter: Benutzerdaten]
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Gerichte & Sätze</CardTitle>
            <CardDescription>Verwalten Sie Gerichte und Honorargruppen.</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
            [Platzhalter: Gerichte / Honorare]
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
