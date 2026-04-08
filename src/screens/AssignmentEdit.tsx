import { useNavigate, useParams } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Save } from "lucide-react";
import { SAMPLE_ASSIGNMENTS } from "../data/sampleData";
import { PageHeader } from "../components/PageHeader";

export function AssignmentEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const selectedAssignment = SAMPLE_ASSIGNMENTS.find(a => a.id === id);

  const actions = (
    <Button onClick={() => navigate("/")}>
      <Save className="mr-2 h-4 w-4" />
      Speichern
    </Button>
  );

  return (
    <>
      <PageHeader 
        title={selectedAssignment ? `Auftrag: ${selectedAssignment.invoiceNumber}` : "Neuer Auftrag"}
        description={selectedAssignment ? `Bearbeiten von ${selectedAssignment.patientName}` : "Erstellen eines neuen Gutachtenauftrags"}
        actions={actions}
        showBack={true}
      />

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
