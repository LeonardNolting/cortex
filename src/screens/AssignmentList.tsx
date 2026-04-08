import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PlusCircle, Settings, FileText, Trash2 } from "lucide-react";
import { AssignmentService } from "../lib/services";
import { Assignment } from "../types";
import { getStatusVariant } from "../lib/status";
import { PageHeader } from "../components/PageHeader";
import { CourtService, RemunerationGroupService, SettingsService } from "../lib/services";
import { generateInvoiceDocx } from "../lib/invoice";
import { writeFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-opener";
import { documentDir, join } from "@tauri-apps/api/path";

export function AssignmentList() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invoice Dialog State
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    printingDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const data = await AssignmentService.getAll();
      setAssignments(data);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Möchten Sie diesen Auftrag wirklich löschen?")) {
      try {
        await AssignmentService.delete(id);
        await loadAssignments();
      } catch (error) {
        console.error("Failed to delete assignment:", error);
      }
    }
  };

  const handleOpenInvoiceDialog = async (assignment: Assignment) => {
    try {
      const nextNumber = await AssignmentService.getNextInvoiceNumber();
      setSelectedAssignment(assignment);
      setInvoiceForm({
        invoiceNumber: nextNumber,
        printingDate: new Date().toISOString().split('T')[0]
      });
      setIsInvoiceDialogOpen(true);
    } catch (error) {
      console.error("Failed to get next invoice number:", error);
    }
  };

  const handleConfirmInvoice = async () => {
    if (!selectedAssignment) return;

    try {
      const [court, remunerationGroup, settings] = await Promise.all([
        CourtService.getById(selectedAssignment.courtId),
        RemunerationGroupService.getById(selectedAssignment.remunerationGroupId),
        SettingsService.getSettings()
      ]);

      if (!court || !remunerationGroup) {
        throw new Error("Gericht oder Vergütungsgruppe nicht gefunden");
      }

      const docxBuffer = await generateInvoiceDocx({
        assignment: selectedAssignment,
        court,
        remunerationGroup,
        settings,
        invoiceNumber: invoiceForm.invoiceNumber,
        printingDate: invoiceForm.printingDate
      });

      const fileName = `Rechnung_${invoiceForm.invoiceNumber}_${selectedAssignment.patientName.replace(/\s+/g, '_')}.docx`;
      const docPath = await join(await documentDir(), fileName);
      
      await writeFile(docPath, docxBuffer);
      await open(docPath);

      await AssignmentService.update({
        ...selectedAssignment,
        invoiceNumber: invoiceForm.invoiceNumber,
        printingDate: invoiceForm.printingDate,
        status: "Abgeschlossen"
      });

      await loadAssignments();
      setIsInvoiceDialogOpen(false);
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      alert("Fehler beim Generieren der Rechnung: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const actions = (
    <>
      <Button variant="outline" size="icon" onClick={() => navigate("/settings")}>
        <Settings className="h-4 w-4" />
      </Button>
      <Button onClick={() => navigate("/edit/new")}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Neuer Auftrag
      </Button>
    </>
  );

  return (
    <>
      <PageHeader 
        title="Cortex" 
        description="Auftragsverwaltung für psychiatrische Gutachter"
        actions={actions}
      />

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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">Lade Aufträge...</TableCell>
                </TableRow>
              ) : assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">Keine Aufträge gefunden.</TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow 
                    key={assignment.id} 
                    className="cursor-pointer"
                    onDoubleClick={() => navigate(`/edit/${assignment.id}`)}
                  >
                    <TableCell className="font-medium">{assignment.invoiceNumber || "-"}</TableCell>
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
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Rechnung generieren"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInvoiceDialog(assignment);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(assignment.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rechnung generieren</DialogTitle>
            <DialogDescription>
              Geben Sie das Rechnungsdatum und die Rechnungsnummer für {selectedAssignment?.patientName} an.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="printingDate" className="text-right">
                Datum
              </Label>
              <Input
                id="printingDate"
                type="date"
                value={invoiceForm.printingDate}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, printingDate: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoiceNumber" className="text-right">
                Nummer
              </Label>
              <Input
                id="invoiceNumber"
                value={invoiceForm.invoiceNumber}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button type="button" onClick={handleConfirmInvoice}>
              Bestätigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
