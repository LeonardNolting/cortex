import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Save, X } from "lucide-react";
import { AssignmentService, CourtService, RemunerationGroupService } from "../lib/services";
import { PageHeader } from "../components/PageHeader";
import { Assignment, Court, RemunerationGroup } from "../types";

export function AssignmentEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [courts, setCourts] = useState<Court[]>([]);
  const [remGroups, setRemGroups] = useState<RemunerationGroup[]>([]);

  const [formData, setFormData] = useState<Partial<Assignment>>({
    patientName: "",
    patientBirthdate: "",
    fileNumber: "",
    courtId: 0,
    remunerationGroupId: 0,
    travelTime: 0,
    travelCount: 1,
    preparationTime: 0,
    evaluationTime: 0,
    writingCharacters: 0,
    printingPages: 0,
    kmCount: 0,
    shippingFee: 0,
    invoiceNumber: "",
    printingDate: "",
    paidAt: ""
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courtsData, remGroupsData] = await Promise.all([
          CourtService.getAll(),
          RemunerationGroupService.getAll()
        ]);
        setCourts(courtsData);
        setRemGroups(remGroupsData);

        if (remGroupsData.length > 0 && isNew) {
          setFormData(prev => ({ ...prev, remunerationGroupId: remGroupsData[0].id }));
        }

        if (!isNew) {
          const assignment = await AssignmentService.getById(Number(id));
          if (assignment) {
            const paidAt = (assignment.paidAt && assignment.paidAt !== "null") ? assignment.paidAt : "";
            setFormData({
              ...assignment,
              invoiceNumber: assignment.invoiceNumber || "",
              printingDate: assignment.printingDate || "",
              paidAt: paidAt
            });
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : parseFloat(value)) : (value === null ? "" : value)
    }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const clearPaidAt = () => {
    setFormData(prev => ({ ...prev, paidAt: "" }));
  };

  const handleSave = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.patientName || formData.patientName.trim() === "") {
      newErrors.patientName = "Bitte geben Sie einen Patientenname ein.";
    }

    if (!formData.courtId || formData.courtId === 0) {
      newErrors.courtId = "Bitte wählen Sie ein Gericht aus.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Focus first error field
      const firstError = Object.keys(newErrors)[0];
      const element = document.getElementById(firstError);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      if (isNew) {
        await AssignmentService.create(formData);
      } else {
        await AssignmentService.update(formData as Assignment);
      }
      navigate("/");
    } catch (error) {
      console.error("Failed to save assignment:", error);
      alert("Fehler beim Speichern des Auftrags.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Lade Daten...
      </div>
    );
  }

  const actions = (
    <div className="flex gap-2">
      <Button onClick={handleSave}>
        <Save className="mr-2 h-4 w-4" />
        Speichern
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title={isNew ? "Neuer Auftrag" : `Auftrag: ${formData.patientName}`}
        description={isNew ? "Erstellen eines neuen Gutachtenauftrags" : `Bearbeiten von ${formData.patientName}`}
        actions={actions}
        showBack={true}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patienten- & Falldaten</CardTitle>
            <CardDescription>
              Allgemeine Informationen zum Gutachtenauftrag.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="patientName">Patientenname <span className="text-destructive">*</span></Label>
                <Input 
                  id="patientName" 
                  name="patientName" 
                  value={formData.patientName} 
                  onChange={handleChange} 
                  placeholder="Max Mustermann"
                  aria-invalid={!!errors.patientName}
                />
                {errors.patientName && <p className="text-xs text-destructive">{errors.patientName}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientBirthdate">Geburtsdatum</Label>
                <Input 
                  id="patientBirthdate" 
                  name="patientBirthdate" 
                  value={formData.patientBirthdate} 
                  onChange={handleChange} 
                  placeholder="TT.MM.JJJJ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fileNumber">Aktenzeichen</Label>
                <Input 
                  id="fileNumber" 
                  name="fileNumber" 
                  value={formData.fileNumber} 
                  onChange={handleChange} 
                  placeholder="123 C 456/23"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="courtId">Gericht <span className="text-destructive">*</span></Label>
              <select
                id="courtId"
                name="courtId"
                value={formData.courtId}
                onChange={handleChange}
                aria-invalid={!!errors.courtId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
              >
                <option value={0} disabled>-- Bitte wählen --</option>
                {courts.map(court => (
                  <option key={court.id} value={court.id}>{court.name}</option>
                ))}
              </select>
              {errors.courtId && <p className="text-xs text-destructive">{errors.courtId}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="remunerationGroupId">Vergütungsgruppe</Label>
              <select
                id="remunerationGroupId"
                name="remunerationGroupId"
                value={formData.remunerationGroupId}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {remGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name} ({group.value}€/h)</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Rechnungsnummer</Label>
              <Input 
                id="invoiceNumber" 
                name="invoiceNumber" 
                value={formData.invoiceNumber} 
                onChange={handleChange} 
                placeholder="Noch nicht generiert"
                readOnly
              />
            </div>
            {formData.printingDate && (
              <div className="space-y-2">
                <Label htmlFor="printingDate">Rechnungsdatum</Label>
                <Input 
                  id="printingDate" 
                  name="printingDate" 
                  value={formData.printingDate} 
                  readOnly
                />
              </div>
            )}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between items-center">
                <Label htmlFor="paidAt">Bezahlt am</Label>
                {formData.paidAt && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={clearPaidAt}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Leeren
                  </Button>
                )}
              </div>
              <Input 
                id="paidAt" 
                name="paidAt" 
                type="date"
                value={formData.paidAt ? formData.paidAt.substring(0, 10) : ""} 
                onChange={handleChange} 
              />
              <p className="text-xs text-muted-foreground">
                Datum an dem die Rechnung beglichen wurde.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rechnungsdetails</CardTitle>
            <CardDescription>
              Zeiten und Kosten für die Rechnungserstellung.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="travelTime">Anfahrt (Minuten)</Label>
                <Input 
                  id="travelTime" 
                  name="travelTime" 
                  type="number" 
                  value={formData.travelTime} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="travelCount">Anzahl Anfahrten</Label>
                <Input 
                  id="travelCount" 
                  name="travelCount" 
                  type="number" 
                  step="0.1" 
                  value={formData.travelCount} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preparationTime">Vorbereitung (Minuten)</Label>
                <Input 
                  id="preparationTime" 
                  name="preparationTime" 
                  type="number" 
                  value={formData.preparationTime} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evaluationTime">Auswertung (Minuten)</Label>
                <Input 
                  id="evaluationTime" 
                  name="evaluationTime" 
                  type="number" 
                  value={formData.evaluationTime} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="writingCharacters">Schreibgebühr (Zeichen)</Label>
                <Input 
                  id="writingCharacters" 
                  name="writingCharacters" 
                  type="number" 
                  value={formData.writingCharacters} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="printingPages">Kopierkosten (Seiten)</Label>
                <Input 
                  id="printingPages" 
                  name="printingPages" 
                  type="number" 
                  value={formData.printingPages} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kmCount">Kilometer (1 Weg)</Label>
                <Input 
                  id="kmCount" 
                  name="kmCount" 
                  type="number" 
                  step="0.1" 
                  value={formData.kmCount} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingFee">Versandkosten (€)</Label>
                <Input 
                  id="shippingFee" 
                  name="shippingFee" 
                  type="number" 
                  step="0.01" 
                  value={formData.shippingFee} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
