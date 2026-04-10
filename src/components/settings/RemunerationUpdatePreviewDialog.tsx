import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { RemunerationGroupService } from "../../lib/services";
import { RemunerationGroup } from "../../types";
import { ParsedRates } from "../../lib/jveg";
import { formatToGermanString } from "../../lib/number-format";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parsedRates: ParsedRates;
  onConfirm: () => void;
}

export function RemunerationUpdatePreviewDialog({ isOpen, onClose, parsedRates, onConfirm }: Props) {
  const [existingGroups, setExistingGroups] = useState<RemunerationGroup[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  async function loadGroups() {
    const groups = await RemunerationGroupService.getAll();
    setExistingGroups(groups);
  }

  const today = new Date().toLocaleDateString("de-DE");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Vergütungssätze anwenden</DialogTitle>
          <DialogDescription>
            Es wurden neue Vergütungssätze gefunden. Möchten Sie diese übernehmen? (Erfasst am: {today})
          </DialogDescription>
        </DialogHeader>

        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Gruppe</TableHead>
              <TableHead>Aktuell</TableHead>
              <TableHead>Neu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {existingGroups.map((group) => {
              const normalizedName = group.name.replace(/\s+/g, '').toUpperCase();
              const newRate = parsedRates[normalizedName];
              const hasChanged = newRate !== undefined && newRate !== group.value;

              return (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>{formatToGermanString(group.value)} €</TableCell>
                  <TableCell className={hasChanged ? "text-green-600 font-bold" : "text-muted-foreground"}>
                    {newRate !== undefined ? `${formatToGermanString(newRate)} €` : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={onConfirm}>Übernehmen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
