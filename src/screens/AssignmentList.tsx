import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { PlusCircle, Settings, FileText } from "lucide-react";
import { SAMPLE_ASSIGNMENTS } from "../data/sampleData";
import { Assignment } from "../types";

export function AssignmentList() {
  const navigate = useNavigate();

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

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cortex</h1>
          <p className="text-muted-foreground">Auftragsverwaltung für psychiatrische Gutachter</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/settings")}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate("/edit/new")}>
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
              {SAMPLE_ASSIGNMENTS.map((assignment) => (
                <TableRow 
                  key={assignment.id} 
                  className="cursor-pointer"
                  onDoubleClick={() => navigate(`/edit/${assignment.id}`)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/edit/${assignment.id}`);
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
}
