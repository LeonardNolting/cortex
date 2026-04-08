import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { Button } from "../ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { CourtService } from "../../lib/services";
import { Court } from "../../types";

export function CourtManagement() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  
  const [formData, setFormData] = useState<Omit<Court, "id">>({
    name: "",
    department: "Abteilung für Betreuungssachen",
    street: "",
    zip: "",
    city: ""
  });

  useEffect(() => {
    loadCourts();
  }, []);

  async function loadCourts() {
    const data = await CourtService.getAll();
    setCourts(data);
  }

  function handleOpen(court?: Court) {
    if (court) {
      setEditingCourt(court);
      setFormData({
        name: court.name,
        department: court.department,
        street: court.street,
        zip: court.zip,
        city: court.city
      });
    } else {
      setEditingCourt(null);
      setFormData({
        name: "",
        department: "Abteilung für Betreuungssachen",
        street: "",
        zip: "",
        city: ""
      });
    }
    setIsOpen(true);
  }

  async function handleSave() {
    if (editingCourt) {
      await CourtService.update({ ...formData, id: editingCourt.id });
    } else {
      await CourtService.create(formData);
    }
    setIsOpen(false);
    loadCourts();
  }

  async function handleDelete(id: number) {
    if (confirm("Möchten Sie dieses Gericht wirklich löschen?")) {
      await CourtService.delete(id);
      loadCourts();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Gerichte</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 h-4 w-4" />
            Hinzufügen
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCourt ? "Gericht bearbeiten" : "Neues Gericht hinzufügen"}</DialogTitle>
              <DialogDescription>
                Geben Sie die Daten des Gerichts ein. Diese werden für die Rechnung verwendet.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Abteilung</Label>
                <Input 
                  id="department" 
                  value={formData.department} 
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="street">Straße & Hausnummer</Label>
                <Input 
                  id="street" 
                  value={formData.street} 
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="grid gap-2 col-span-1">
                  <Label htmlFor="zip">PLZ</Label>
                  <Input 
                    id="zip" 
                    value={formData.zip} 
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })} 
                  />
                </div>
                <div className="grid gap-2 col-span-3">
                  <Label htmlFor="city">Stadt</Label>
                  <Input 
                    id="city" 
                    value={formData.city} 
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Abbrechen</Button>
              <Button onClick={handleSave}>Speichern</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Abteilung</TableHead>
              <TableHead>Ort</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courts.map((court) => (
              <TableRow key={court.id}>
                <TableCell className="font-medium">{court.name}</TableCell>
                <TableCell>{court.department}</TableCell>
                <TableCell>{court.zip} {court.city}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpen(court)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(court.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
