export type Screen = "LIST" | "EDIT" | "SETTINGS";

export interface Assignment {
  id: string;
  invoiceNumber: string;
  patientName: string;
  patientBirthdate: string;
  fileNumber: string;
  courtId: string;
  remunerationGroupId: string;
  court?: string; // For UI display
  remunerationGroup?: string; // For UI display
  status: "Offen" | "In Bearbeitung" | "Abgeschlossen";
  createdAt: string;
}

export interface Court {
  id: number;
  name: string;
  department: string;
  street: string;
  zip: string;
  city: string;
}

export interface RemunerationGroup {
  id: number;
  name: string;
  value: number;
}
