import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { DatePicker } from "../components/ui/date-picker";
import { PlusCircle, Settings, FileText, Trash2, Calculator, AlertCircle, X, Info, Play, Square, CalendarPlus } from "lucide-react";
import { AssignmentService } from "../lib/services";
import { Assignment } from "../types";
import { PageHeader } from "../components/PageHeader";
import { CourtService, RemunerationGroupService, SettingsService } from "../lib/services";
import { JvegService, ParsedRates } from "../lib/jveg";
import { RemunerationUpdatePreviewDialog } from "../components/settings/RemunerationUpdatePreviewDialog";
import { generateInvoiceDocx, calculateInvoiceValues, generateIncomeTaxDocx } from "../lib/invoice";
import { writeFile } from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";
import { documentDir, join } from "@tauri-apps/api/path";

export function AssignmentList() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Invoice Dialog State
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    printingDate: new Date().toISOString().split('T')[0],
    useCurrentRates: true
  });

  // Income Tax Dialog State
  const [isTaxDialogOpen, setIsTaxDialogOpen] = useState(false);
  const [taxForm, setTaxForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<number | null>(null);

  // JVEG Update State
  const [jvegUpdates, setJvegUpdates] = useState<{ hasUpdates: boolean; jsonString?: string; error?: string }>({ hasUpdates: false });
  const [jvegParsedRates, setJvegParsedRates] = useState<ParsedRates | null>(null);
  const [isJvegPreviewOpen, setIsJvegPreviewOpen] = useState(false);

  useEffect(() => {
    loadAssignments();
    checkJvegUpdates();
  }, []);

  const checkJvegUpdates = async () => {
    const result = await JvegService.checkForUpdates();
    setJvegUpdates(result);
  };

  const handleParseRates = () => {
    if (jvegUpdates.jsonString) {
      const rates = JvegService.parseHtmlForRates(jvegUpdates.jsonString);
      if (rates) {
        setJvegParsedRates(rates);
        setIsJvegPreviewOpen(true);
      } else {
        setJvegUpdates(prev => ({ ...prev, error: "Fehler beim Parsen der neuen Vergütungssätze (Format unerwartet)." }));
      }
    }
  };

  const handleApplyRates = async () => {
    if (jvegParsedRates && jvegUpdates.jsonString) {
      await JvegService.applyRates(jvegParsedRates, jvegUpdates.jsonString);
      setIsJvegPreviewOpen(false);
      setJvegUpdates({ hasUpdates: false });
      // Reload assignments and settings
      loadAssignments();
    }
  };

  const loadAssignments = async () => {
    try {
      const [data, settingsData] = await Promise.all([
        AssignmentService.getAll(),
        SettingsService.getSettings()
      ]);
      setAssignments(data);
      setSettings(settingsData);
    } catch (error) {
      console.error("Failed to load assignments or settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaid = async (assignment: Assignment, isPaid: boolean) => {
    try {
      const updatedAssignment = {
        ...assignment,
        paidAt: isPaid ? new Date().toISOString().split('T')[0] : ""
      };
      await AssignmentService.update(updatedAssignment);
      await loadAssignments();
    } catch (error) {
      console.error("Failed to toggle paid status:", error);
    }
  };

  const handleStartWorking = async (assignment: Assignment) => {
    try {
      const updatedAssignment = {
        ...assignment,
        startedWorkingDate: new Date().toISOString().split("T")[0],
      };
      await AssignmentService.update(updatedAssignment);
      await loadAssignments();
    } catch (error) {
      console.error("Failed to set started working date:", error);
    }
  };

  const handleStopWorking = async (assignment: Assignment) => {
    try {
      const updatedAssignment = {
        ...assignment,
        startedWorkingDate: "",
      };
      await AssignmentService.update(updatedAssignment);
      await loadAssignments();
    } catch (error) {
      console.error("Failed to clear started working date:", error);
    }
  };

  const handleUpdateSubmissionDate = async (assignment: Assignment, submissionDate?: string) => {
    try {
      await AssignmentService.update({
        ...assignment,
        submissionDate: submissionDate || "",
      });
      await loadAssignments();
    } catch (error) {
      console.error("Failed to update submission date:", error);
    }
  };

  const handlePostponeSubmissionByWeek = async (assignment: Assignment) => {
    if (!assignment.submissionDate) return;

    const currentSubmissionDate = new Date(assignment.submissionDate);
    currentSubmissionDate.setDate(currentSubmissionDate.getDate() + 7);
    const newSubmissionDate = currentSubmissionDate.toISOString().split("T")[0];

    await handleUpdateSubmissionDate(assignment, newSubmissionDate);
  };

  const handleDeleteClick = (id: number) => {
    setAssignmentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (assignmentToDelete !== null) {
      try {
        await AssignmentService.delete(assignmentToDelete);
        setAssignmentToDelete(null);
        setIsDeleteDialogOpen(false);
        await loadAssignments();
      } catch (error) {
        console.error("Failed to delete assignment:", error);
      }
    }
  };

  const getMissingInvoiceFields = (assignment: Assignment): string[] => {
    // Based on required inputs in `legacy.html` (and their equivalents in the edit screen).
    const missing: string[] = [];

    if (!assignment.patientName || assignment.patientName.trim() === "") missing.push("Patientenname");
    if (!assignment.courtId || assignment.courtId === 0) missing.push("Gericht");
    if (!assignment.remunerationGroupId || assignment.remunerationGroupId === 0) missing.push("Vergütungsgruppe");

    if (!(typeof assignment.travelTime === "number" && assignment.travelTime > 0)) missing.push("Anfahrt (Minuten)");
    if (!(typeof assignment.travelCount === "number" && assignment.travelCount > 0)) missing.push("Anzahl Anfahrten");
    if (!(typeof assignment.preparationTime === "number" && assignment.preparationTime > 0)) missing.push("Vorbereitung (Minuten)");
    if (!(typeof assignment.evaluationTime === "number" && assignment.evaluationTime > 0)) missing.push("Auswertung (Minuten)");
    if (!(typeof assignment.writingCharacters === "number" && assignment.writingCharacters > 0)) missing.push("Schreibgebühr (Zeichen)");

    return missing;
  };

  const handleOpenInvoiceDialog = async (assignment: Assignment) => {
    try {
      // Use existing invoice number if available, otherwise get next one
      const invoiceNumber = assignment.invoiceNumber || await AssignmentService.getNextInvoiceNumber();
      
      setSelectedAssignment(assignment);
      setInvoiceForm({
        invoiceNumber,
        printingDate: assignment.printingDate || new Date().toISOString().split('T')[0],
        useCurrentRates: !assignment.invoiceNumber
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

      // If user wants to use current rates, we clear the persisted rates from the assignment
      // so that calculateInvoiceValues uses the current settings/remuneration group values.
      const assignmentToProcess = { ...selectedAssignment };
      if (invoiceForm.useCurrentRates) {
        delete assignmentToProcess.remunerationGroupValue;
        delete assignmentToProcess.writingFeeRate;
        delete assignmentToProcess.printingFeeRate;
        delete assignmentToProcess.kmFeeRate;
        delete assignmentToProcess.taxRate;
      }

      const invoiceData = {
        assignment: assignmentToProcess,
        court,
        remunerationGroup,
        settings,
        invoiceNumber: invoiceForm.invoiceNumber,
        printingDate: invoiceForm.printingDate
      };

      const docxArray = await generateInvoiceDocx(invoiceData);
      const values = calculateInvoiceValues(invoiceData);

      const fileName = `Rechnung_${invoiceForm.invoiceNumber}_${selectedAssignment.patientName.replace(/\s+/g, '_')}.docx`;
      const docPath = await join(await documentDir(), fileName);
      
      await writeFile(docPath, docxArray);
      await openPath(docPath);

      await AssignmentService.update({
        ...selectedAssignment,
        ...values,
        invoiceNumber: invoiceForm.invoiceNumber,
        printingDate: invoiceForm.printingDate
      });

      await loadAssignments();
      setIsInvoiceDialogOpen(false);
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      alert("Fehler beim Generieren der Rechnung: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleGenerateTaxListing = async () => {
    try {
      const paidAssignments = await AssignmentService.getPaidByMonth(taxForm.month, taxForm.year);
      
      if (paidAssignments.length === 0) {
        alert("Keine bezahlten Aufträge für diesen Zeitraum gefunden.");
        return;
      }

      const settings = await SettingsService.getSettings();
      const docxArray = await generateIncomeTaxDocx(
        paidAssignments,
        settings,
        taxForm.month,
        taxForm.year
      );

      const monthStr = taxForm.month.toString().padStart(2, '0');
      const fileName = `Einnahmen_${taxForm.year}_${monthStr}.docx`;
      const docPath = await join(await documentDir(), fileName);
      
      await writeFile(docPath, docxArray);
      await openPath(docPath);
      
      setIsTaxDialogOpen(false);
    } catch (error) {
      console.error("Failed to generate tax listing:", error);
      alert("Fehler beim Generieren der Einnahmenübersicht.");
    }
  };

  // Categorize and sort assignments
  const categorizedAssignments = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const submissionWarningDays = settings?.submissionWarningDays || 14;

    const openAssignments = assignments.filter(a => !a.paidAt && !a.invoiceNumber);
    const warningThresholdDate = new Date();
    warningThresholdDate.setDate(warningThresholdDate.getDate() + submissionWarningDays);

    const workingOn = openAssignments
      .filter(a => a.startedWorkingDate)
      .sort((a, b) => new Date(b.startedWorkingDate!).getTime() - new Date(a.startedWorkingDate!).getTime());

    const urgent = openAssignments
      .filter(a => !a.startedWorkingDate && a.submissionDate && new Date(a.submissionDate) <= warningThresholdDate)
      .sort((a, b) => new Date(a.submissionDate!).getTime() - new Date(b.submissionDate!).getTime());

    const othersOpen = openAssignments
      .filter(a => !a.startedWorkingDate && (!a.submissionDate || new Date(a.submissionDate) > warningThresholdDate))
      .sort((a, b) => {
        if (a.submissionDate && b.submissionDate) {
          return new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
        }
        if (a.submissionDate) return -1;
        if (b.submissionDate) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    const openList = [...workingOn, ...urgent, ...othersOpen];

    const ready = assignments
      .filter(a => !a.paidAt && !!a.invoiceNumber)
      .sort((a, b) => {
        const dateA = a.printingDate ? new Date(a.printingDate).getTime() : 0;
        const dateB = b.printingDate ? new Date(b.printingDate).getTime() : 0;
        return dateA - dateB;
      });

    const paidThisMonth = assignments
      .filter(a => {
        if (!a.paidAt) return false;
        const paidDate = new Date(a.paidAt);
        return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
      })
      .sort((a, b) => {
        const dateA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
        const dateB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
        return dateB - dateA;
      });

    const archive = assignments
      .filter(a => {
        if (!a.paidAt) return false;
        const paidDate = new Date(a.paidAt);
        return !(paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { openList, ready, paidThisMonth, archive };
  }, [assignments, settings]);

  const AssignmentTable = ({ list }: { list: Assignment[] }) => {
    const isOverdue = (assignment: Assignment) => {
      if (!assignment.invoiceNumber || !assignment.printingDate || assignment.paidAt || !settings) return false;
      const printDate = new Date(assignment.printingDate);
      const deadlineDate = new Date(printDate);
      deadlineDate.setDate(deadlineDate.getDate() + (settings.paymentDeadlineDays || 14));
      return new Date() > deadlineDate;
    };

    const isWorkingOn = (assignment: Assignment) => {
      return !assignment.paidAt && !assignment.invoiceNumber && !!assignment.startedWorkingDate;
    };

    const isUrgentOpen = (assignment: Assignment) => {
      if (assignment.paidAt || assignment.invoiceNumber || assignment.startedWorkingDate || !assignment.submissionDate) return false;
      const submissionWarningDays = settings?.submissionWarningDays || 14;
      const warningThresholdDate = new Date();
      warningThresholdDate.setDate(warningThresholdDate.getDate() + submissionWarningDays);
      const submissionDate = new Date(assignment.submissionDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      submissionDate.setHours(0, 0, 0, 0);
      return submissionDate >= today && submissionDate <= warningThresholdDate;
    };

    const isSubmissionOverdue = (assignment: Assignment) => {
      if (assignment.paidAt || assignment.invoiceNumber || assignment.startedWorkingDate || !assignment.submissionDate) return false;
      const submissionDate = new Date(assignment.submissionDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      submissionDate.setHours(0, 0, 0, 0);
      return submissionDate < today;
    };

    const getDaysDiff = (dateInput: string | Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatDays = (days: number) => `${days} ${days === 1 ? "Tag" : "Tage"}`;
    const formatInDays = (days: number) => `in ${days} ${days === 1 ? "Tag" : "Tagen"}`;
    const formatAgoDays = (days: number) => `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;

    const getStatusText = (assignment: Assignment) => {
      if (assignment.paidAt) {
        return `Bezahlt am ${new Date(assignment.paidAt).toLocaleDateString("de-DE")}`;
      }

      if (assignment.invoiceNumber && assignment.printingDate) {
        const printDate = new Date(assignment.printingDate);
        const deadlineDate = new Date(printDate);
        deadlineDate.setDate(deadlineDate.getDate() + (settings?.paymentDeadlineDays || 14));
        const diff = getDaysDiff(deadlineDate);
        
        if (diff < 0) {
          return `Zahlung überfällig (${formatDays(Math.abs(diff))})`;
        } else if (diff === 0) {
          return "Zahlung heute fällig";
        } else {
          return `Zahlung fällig ${formatInDays(diff)}`;
        }
      }

      if (assignment.startedWorkingDate) {
        return "In Bearbeitung";
      }

      if (assignment.submissionDate) {
        const submissionWarningDays = settings?.submissionWarningDays || 14;
        const diff = getDaysDiff(assignment.submissionDate);
        if (diff < 0) {
          return `Abgabe überfällig (${formatAgoDays(Math.abs(diff))})`;
        } else if (diff === 0) {
          return "Abgabe heute fällig";
        } else if (diff <= submissionWarningDays) {
          return `Abgabe ${formatInDays(diff)}`;
        } else {
          return `Abgabe am ${new Date(assignment.submissionDate).toLocaleDateString("de-DE")}`;
        }
      }

      return "Offen";
    };

    const getStatusBadge = (assignment: Assignment) => {
      const overdue = isOverdue(assignment);
      const workingOn = isWorkingOn(assignment);
      const urgent = isUrgentOpen(assignment);
      const submissionOverdue = isSubmissionOverdue(assignment);

      const statusText = getStatusText(assignment);

      let badgeClass = "w-fit text-sm px-2 py-0.5 border-transparent";
      
      if (assignment.paidAt) {
        badgeClass = "w-fit text-sm px-2 py-0.5 border-blue-600 text-blue-700 bg-blue-50 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400";
      } else if (workingOn) {
        badgeClass = "w-fit text-sm px-2 py-0.5 border-green-600 text-green-700 bg-green-50 hover:bg-green-50 dark:bg-green-950 dark:text-green-400";
      } else if (submissionOverdue) {
        badgeClass = "w-fit text-sm px-2 py-0.5 border-red-600 text-red-700 bg-red-50 hover:bg-red-50 dark:bg-red-950 dark:text-red-400";
      } else if (overdue || urgent) {
        badgeClass = "w-fit text-sm px-2 py-0.5 border-amber-600 text-amber-700 bg-amber-50 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400";
      } else {
        badgeClass = "w-fit text-sm px-2 py-0.5 border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400";
      }

      return (
        <Badge variant="outline" className={badgeClass}>
          {statusText}
        </Badge>
      );
    };

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px]">Rechnungs-Nr.</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Geburtsdatum</TableHead>
            <TableHead>Aktenzeichen</TableHead>
            <TableHead>Gericht</TableHead>
            <TableHead>Gruppe</TableHead>
            <TableHead className="w-[210px]">Abgabe</TableHead>
            <TableHead>Bezahlt</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                Keine Aufträge in dieser Kategorie.
              </TableCell>
            </TableRow>
          ) : (
            list.map((assignment) => {
              const overdue = isOverdue(assignment);
              const workingOn = isWorkingOn(assignment);
              const urgent = isUrgentOpen(assignment);
              const submissionOverdue = isSubmissionOverdue(assignment);

              let rowClass = "";
              if (workingOn) {
                rowClass = "bg-green-50/50 hover:bg-green-100/50 dark:bg-green-950/10 dark:hover:bg-green-950/20";
              } else if (submissionOverdue) {
                rowClass = "bg-red-50/50 hover:bg-red-100/50 dark:bg-red-950/10 dark:hover:bg-red-950/20";
              } else if (overdue || urgent) {
                rowClass = "bg-amber-50/50 hover:bg-amber-100/50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20";
              }

              return (
                <TableRow
                  key={assignment.id}
                  className={`cursor-pointer ${rowClass}`}
                  onDoubleClick={() => navigate(`/edit/${assignment.id}`)}
                >
                  <TableCell>
                    {getStatusBadge(assignment)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {assignment.invoiceNumber || "-"}
                  </TableCell>
                  <TableCell>{assignment.patientName}</TableCell>
                  <TableCell>{assignment.patientBirthdate}</TableCell>
                  <TableCell>{assignment.fileNumber}</TableCell>
                  <TableCell>{assignment.court}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{assignment.remunerationGroup}</Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DatePicker
                      date={assignment.submissionDate || ""}
                      setDate={(date) => handleUpdateSubmissionDate(assignment, date)}
                      placeholder="Abgabedatum"
                      clearable
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={!!assignment.paidAt} 
                    onChange={(e) => handleTogglePaid(assignment, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    title={assignment.paidAt ? `Bezahlt am ${assignment.paidAt}` : "Noch nicht bezahlt"}
                  />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {!assignment.paidAt && !assignment.invoiceNumber && !assignment.startedWorkingDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      title="Bearbeitung starten"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartWorking(assignment);
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Anfangen
                    </Button>
                  )}
                  {!assignment.paidAt && !assignment.invoiceNumber && !!assignment.startedWorkingDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      title="Bearbeitung stoppen"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStopWorking(assignment);
                      }}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Bearbeitung stoppen
                    </Button>
                  )}
                  {submissionOverdue && (
                    <Button
                      variant="outline"
                      size="sm"
                      title="Abgabefrist um eine Woche verschieben"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePostponeSubmissionByWeek(assignment);
                      }}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      +1 Woche
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    title="Rechnung generieren"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenInvoiceDialog(assignment);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Rechnung
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(assignment.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })
      )}
    </TableBody>
  </Table>
);
};

  const actions = (
    <>
      <Button variant="outline" onClick={() => setIsTaxDialogOpen(true)} title="Einnahmenübersicht">
        <Calculator className="mr-2 h-4 w-4" />
        Einnahmen
      </Button>
      <Button variant="outline" onClick={() => navigate("/settings")}>
        <Settings className="mr-2 h-4 w-4" />
        Einstellungen
      </Button>
      <Button onClick={() => navigate("/edit/new")}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Neuer Auftrag
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Cortex" 
        description="Auftragsverwaltung für psychiatrische Gutachter"
        actions={actions}
      />

      {jvegUpdates.error && (
        <div className="bg-destructive/15 border border-destructive/50 text-destructive px-4 py-3 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="flex-1 text-sm">{jvegUpdates.error}</div>
          <button onClick={() => setJvegUpdates(prev => ({ ...prev, error: undefined }))} className="text-destructive hover:bg-destructive/20 rounded-sm p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {jvegUpdates.hasUpdates && !jvegUpdates.error && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 px-4 py-3 rounded-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 shrink-0" />
            <div className="text-sm font-medium">Änderungen im JVEG erkannt. Möchten Sie die neuen Vergütungssätze prüfen?</div>
          </div>
          <Button size="sm" variant="outline" className="border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900" onClick={handleParseRates}>
            Prüfen & Übernehmen
          </Button>
        </div>
      )}

      {jvegParsedRates && (
        <RemunerationUpdatePreviewDialog 
          isOpen={isJvegPreviewOpen} 
          onClose={() => setIsJvegPreviewOpen(false)}
          parsedRates={jvegParsedRates}
          onConfirm={handleApplyRates}
        />
      )}

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center">Lade Aufträge...</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Offen</CardTitle>
              <CardDescription>
                Offene Aufträge, für die noch keine Rechnung erstellt wurde.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssignmentTable list={categorizedAssignments.openList} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bereit zur Abrechnung / Offen</CardTitle>
              <CardDescription>
                Gutachten mit erstellter Rechnung, die noch nicht als bezahlt markiert wurden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssignmentTable list={categorizedAssignments.ready} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Diesen Monat bezahlt</CardTitle>
              <CardDescription>
                Gutachten, die im aktuellen Kalendermonat bezahlt wurden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssignmentTable list={categorizedAssignments.paidThisMonth} />
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="archive">
              <AccordionTrigger className="hover:no-underline px-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold">Archiv</span>
                  <Badge variant="secondary">{categorizedAssignments.archive.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <Card>
                  <CardHeader>
                    <CardDescription>
                      Alle bereits bezahlten Gutachten aus vergangenen Monaten.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AssignmentTable list={categorizedAssignments.archive} />
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Möchten Sie diesen Auftrag wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Auftrag wird dauerhaft aus der Datenbank entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rechnung generieren</DialogTitle>
            <DialogDescription>
              Geben Sie das Rechnungsdatum und die Rechnungsnummer für {selectedAssignment?.patientName} an.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedAssignment && getMissingInvoiceFields(selectedAssignment).length > 0 && (
              <div className="text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-200 text-xs space-y-2">
                <div>
                  Hinweis: Für diesen Auftrag fehlen noch Pflichtangaben. Die Rechnung kann trotzdem generiert werden, kann aber unvollständig sein:
                  <ul className="mt-2 list-disc pl-5 space-y-1 font-normal">
                    {getMissingInvoiceFields(selectedAssignment).map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-amber-300 hover:bg-amber-100"
                    onClick={() => {
                      setIsInvoiceDialogOpen(false);
                      navigate(`/edit/${selectedAssignment.id}`);
                    }}
                  >
                    Auftrag bearbeiten
                  </Button>
                </div>
              </div>
            )}
            {selectedAssignment?.invoiceNumber && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Welche Sätze sollen verwendet werden?</Label>
                  <p className="text-[11px] text-muted-foreground leading-none">
                    z. B. Vergütungsgruppen, Kopierkosten, etc.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="useOldRates"
                      name="rateChoice"
                      checked={!invoiceForm.useCurrentRates}
                      onChange={() => setInvoiceForm(prev => ({ ...prev, useCurrentRates: false }))}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="useOldRates" className="cursor-pointer font-normal">
                      Gespeicherte Sätze der bestehenden Rechnung verwenden 
                      {selectedAssignment?.printingDate && ` (vom ${new Date(selectedAssignment.printingDate).toLocaleDateString("de-DE")})`}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="useCurrentRates"
                      name="rateChoice"
                      checked={invoiceForm.useCurrentRates}
                      onChange={() => setInvoiceForm(prev => ({ ...prev, useCurrentRates: true }))}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="useCurrentRates" className="cursor-pointer font-normal">Aktuelle Sätze aus den Einstellungen verwenden</Label>
                  </div>
                </div>
                {invoiceForm.useCurrentRates && (
                  <div className="mt-2 text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-200 text-xs">
                    Hinweis: Die zuvor gespeicherten Honorarsätze werden durch die aktuellen Einstellungen überschrieben.
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="printingDate" className="text-right">
                Datum
              </Label>
              <div className="col-span-3">
                <DatePicker
                  date={invoiceForm.printingDate}
                  setDate={(date) => setInvoiceForm(prev => ({ ...prev, printingDate: date || "" }))}
                />
              </div>
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

      <Dialog open={isTaxDialogOpen} onOpenChange={setIsTaxDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Einnahmenübersicht generieren</DialogTitle>
            <DialogDescription>
              Wählen Sie den Monat und das Jahr für die Übersicht der bezahlten Aufträge.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="month" className="text-right">
                Monat
              </Label>
              <select
                id="month"
                value={taxForm.month}
                onChange={(e) => setTaxForm(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('de-DE', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Jahr
              </Label>
              <Input
                id="year"
                type="number"
                value={taxForm.year}
                onChange={(e) => setTaxForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsTaxDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button type="button" onClick={handleGenerateTaxListing}>
              Generieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
