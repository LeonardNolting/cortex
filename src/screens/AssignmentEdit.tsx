import { useNavigate, useParams } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { SAMPLE_ASSIGNMENTS } from "../data/sampleData";

export function AssignmentEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const selectedAssignment = SAMPLE_ASSIGNMENTS.find(a => a.id === id);

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/")}>
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
        <Button onClick={() => navigate("/")}>
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
          [Formular-Platzhalter für Auftragsdaten mit ID: {id}]
        </CardContent>
      </Card>
    </>
  );
}
