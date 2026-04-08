import { useState } from "react";
import "./App.css";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "./components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { PlusCircle, Settings, FileText, ArrowLeft, Save } from "lucide-react";

// Types
type Screen = "LIST" | "EDIT" | "SETTINGS";

interface Assignment {
  id: string;
  invoiceNumber: string;
  patientName: string;
  patientBirthdate: string;
  fileNumber: string;
  court: string;
  remunerationGroup: string;
  status: "Offen" | "In Bearbeitung" | "Abgeschlossen";
  createdAt: string;
}

// Sample Data
const SAMPLE_ASSIGNMENTS: Assignment[] = [
  {
    id: "1",
    invoiceNumber: "ZZK260401",
    patientName: "Max Mustermann",
    patientBirthdate: "01.01.1980",
    fileNumber: "123 Js 456/26",
    court: "Landgericht Berlin",
    remunerationGroup: "M2",
    status: "Offen",
    createdAt: "2026-04-01",
  },
  {
    id: "2",
    invoiceNumber: "ZZK260402",
    patientName: "Erika Mustermann",
    patientBirthdate: "15.05.1975",
    fileNumber: "789 C 101/26",
    court: "Amtsgericht München",
    remunerationGroup: "M3",
    status: "In Bearbeitung",
    createdAt: "2026-04-02",
  },
  {
    id: "3",
    invoiceNumber: "ZZK260315",
    patientName: "Hans Schmidt",
    patientBirthdate: "20.11.1990",
    fileNumber: "234 O 567/26",
    court: "Landgericht Hamburg",
    remunerationGroup: "M2",
    status: "Abgeschlossen",
    createdAt: "2026-03-15",
  },
];

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("LIST");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [assignments] = useState<Assignment[]>(SAMPLE_ASSIGNMENTS);

  const getStatusVariant = (status: Assignment["status"]) => {
    switch (status) {
      case "Offen":
        return "secondary";
      case "In Bearbeitung":
        return "default";
      case "Abgeschlossen":
        return "outline";
      default:
        return "default";
    }
  };

  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);

  // --- RENDERING FUNCTIONS ---

  const renderList = () => (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cortex</h1>
          <p className="text-muted-foreground">Auftragsverwaltung für psychiatrische Gutachter</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentScreen("SETTINGS")}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button onClick={() => { setSelectedAssignmentId(null); setCurrentScreen("EDIT"); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Neuer Auftrag
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aufträge</CardTitle>
          <CardDescription>
            Übersicht aller aktuellen psychiatrischen Gutachtenaufträge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Rechnungs-Nr.</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Geburtsdatum</TableHead>
                <TableHead>Aktenzeichen</TableHead>
                <TableHead>Gericht</TableHead>
                <TableHead>Gruppe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow 
                  key={assignment.id} 
                  className="cursor-pointer"
                  onDoubleClick={() => {
                    setSelectedAssignmentId(assignment.id);
                    setCurrentScreen("EDIT");
                  }}
                >
                  <TableCell className="font-medium">{assignment.invoiceNumber}</TableCell>
                  <TableCell>{assignment.patientName}</TableCell>
                  <TableCell>{assignment.patientBirthdate}</TableCell>
                  <TableCell>{assignment.fileNumber}</TableCell>
                  <TableCell>{assignment.court}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{assignment.remunerationGroup}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(assignment.status)}>
                      {assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setSelectedAssignmentId(assignment.id);
                        setCurrentScreen("EDIT");
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Bearbeiten
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );

  const renderEdit = () => (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentScreen("LIST")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedAssignment ? `Auftrag: ${selectedAssignment.invoiceNumber}` : "Neuer Auftrag"}
            </h1>
            <p className="text-muted-foreground">
              {selectedAssignment ? `Bearbeiten von ${selectedAssignment.patientName}` : "Erstellen eines neuen Gutachtenauftrags"}
            </p>
          </div>
        </div>
        <Button onClick={() => setCurrentScreen("LIST")}>
          <Save className="mr-2 h-4 w-4" />
          Speichern
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auftragsdetails</CardTitle>
          <CardDescription>
            Geben Sie hier die Patientendaten und Rechnungsdetails ein.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
          [Formular-Platzhalter für Auftragsdaten]
        </CardContent>
      </Card>
    </>
  );

  const renderSettings = () => (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentScreen("LIST")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
            <p className="text-muted-foreground">Globale Daten und Rechnungstexte verwalten</p>
          </div>
        </div>
        <Button onClick={() => setCurrentScreen("LIST")}>
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

  return (
    <main className="container mx-auto py-10 px-4">
      {currentScreen === "LIST" && renderList()}
      {currentScreen === "EDIT" && renderEdit()}
      {currentScreen === "SETTINGS" && renderSettings()}
    </main>
  );
}

export default App;
