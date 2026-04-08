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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RemunerationGroupService } from "../../lib/services";
import { RemunerationGroup } from "../../types";

export function RemunerationGroupManagement() {
  const [groups, setGroups] = useState<RemunerationGroup[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<RemunerationGroup | null>(null);
  
  const [formData, setFormData] = useState<RemunerationGroup>({
    id: "",
    name: "",
    value: 0
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
      setFormData(group);
    } else {
      setEditingGroup(null);
      setFormData({
        id: "",
        name: "",
        value: 0
      });
    }
    setIsOpen(true);
  }

  async function handleSave() {
    if (editingGroup) {
      await RemunerationGroupService.update(formData);
    } else {
      await RemunerationGroupService.create(formData);
    }
    setIsOpen(false);
    loadGroups();
  }

  async function handleDelete(id: string) {
    if (confirm("Möchten Sie diese Vergütungsgruppe wirklich löschen?")) {
      await RemunerationGroupService.delete(id);
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
                <Label htmlFor="id">ID (z.B. m1)</Label>
                <Input 
                  id="id" 
                  value={formData.id} 
                  disabled={!!editingGroup}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })} 
                />
              </div>
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
                <Input 
                  id="value" 
                  type="number"
                  value={formData.value} 
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })} 
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

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Stundensatz</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell className="font-mono">{group.id}</TableCell>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>{group.value.toFixed(2)} €</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpen(group)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)}>
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
