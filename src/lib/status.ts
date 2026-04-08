import { Assignment } from "../types";

export function getStatusVariant(status: Assignment["status"]) {
  switch (status) {
    case "Offen":
      return "secondary" as const;
    case "In Bearbeitung":
      return "default" as const;
    case "Abgeschlossen":
      return "outline" as const;
    default:
      return "default" as const;
  }
}
