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
  DialogTitle 
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RemunerationGroupService } from "../../lib/services";
import { RemunerationGroup } from "../../types";
import { formatToGermanString, parseGermanNumber } from "../../lib/number-format";
import { NumericInput } from "../ui/numeric-input";

export function RemunerationGroupManagement() {
  const [groups, setGroups] = useState<RemunerationGroup[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<RemunerationGroup | null>(null);
  const [groupIdToDelete, setGroupIdToDelete] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    value: "0,00"
  });

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    const data = await RemunerationGroupService.getAll();
    setGroups(data);
  }

  function handleOpen(group?: RemunerationGroup) {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        value: formatToGermanString(group.value)
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: "",
        value: "0,00"
      });
    }
    setIsOpen(true);
  }

  async function handleSave() {
    const dataToSave = {
      name: formData.name,
      value: parseGermanNumber(formData.value)
    };

    if (editingGroup) {
      await RemunerationGroupService.update({ ...dataToSave, id: editingGroup.id });
    } else {
      await RemunerationGroupService.create(dataToSave);
    }
    setIsOpen(false);
    loadGroups();
  }

  function handleDeleteClick(id: number) {
    setGroupIdToDelete(id);
    setIsDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (groupIdToDelete !== null) {
      await RemunerationGroupService.delete(groupIdToDelete);
      setGroupIdToDelete(null);
      setIsDeleteDialogOpen(false);
      loadGroups();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Vergütungsgruppen</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 h-4 w-4" />
            Hinzufügen
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGroup ? "Vergütungsgruppe bearbeiten" : "Neue Vergütungsgruppe hinzufügen"}</DialogTitle>
              <DialogDescription>
                Geben Sie die Daten der Vergütungsgruppe ein.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name (z.B. M1)</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Stundensatz (€)</Label>
                <NumericInput 
                  id="value" 
                  value={formData.value} 
                  onValueChange={(val) => setFormData({ ...formData, value: val })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Abbrechen</Button>
              <Button onClick={handleSave}>Speichern</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Möchten Sie diese Vergütungsgruppe wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Vergütungsgruppe wird dauerhaft aus der Datenbank entfernt.
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

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Stundensatz</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>{group.value.toFixed(2)} €</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpen(group)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(group.id)}>
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
