export type Screen = "LIST" | "EDIT" | "SETTINGS";

export interface Assignment {
  id: number;
  invoiceNumber: string;
  patientName: string;
  patientBirthdate: string;
  fileNumber: string;
  courtId: number;
  remunerationGroupId: number;
  travelTime?: number; // minutes
  preparationTime?: number; // minutes
  evaluationTime?: number; // minutes
  writingCharacters?: number;
  printingPages?: number;
  kmCount?: number;
  shippingFee?: number;
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

export interface Settings {
  userName: string;
  userBirthday: string;
  userStreet: string;
  userZip: string;
  userCity: string;
  userTaxId: string;
  taxRate: number;
  kmFee: number;
  writingFee: number;
  printingFee: number;
}
