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
  id: string; // Using string as requested by defaults (m1, m2, m3) or number if auto-gen
  name: string;
  value: number;
}
