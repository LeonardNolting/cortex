export type Screen = "LIST" | "EDIT" | "SETTINGS";

export interface Assignment {
  id: string;
  invoiceNumber: string;
  patientName: string;
  patientBirthdate: string;
  fileNumber: string;
  court: string;
  remunerationGroup: string;
  status: "Offen" | "In Bearbeitung" | "Abgeschlossen";
  createdAt: string;
}
