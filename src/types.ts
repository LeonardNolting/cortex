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
  travelCount?: number; // number of trips
  preparationTime?: number; // minutes
  evaluationTime?: number; // minutes
  writingCharacters?: number;
  printingPages?: number;
  kmCount?: number;
  shippingFee?: number;
  court?: string; // For UI display
  remunerationGroup?: string; // For UI display
  createdAt: string;
  printingDate?: string;
  paidAt?: string;
  // Calculated values stored at the time of invoicing
  totalMinutes?: number;
  roundedMinutes?: number;
  timeEuro?: number;
  writingEuro?: number;
  printingEuro?: number;
  kmEuro?: number;
  shippingEuro?: number;
  netEuro?: number;
  taxEuro?: number;
  grossEuro?: number;
  // Persistent rates at the time of invoicing
  remunerationGroupValue?: number;
  writingFeeRate?: number;
  printingFeeRate?: number;
  kmFeeRate?: number;
  taxRate?: number;
  submissionDate?: string;
  startedWorkingDate?: string;
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
  userBank: string;
  userIban: string;
  userBic: string;
  taxRate: number;
  kmFee: number;
  writingFee: number;
  printingFee: number;
  paymentDeadlineDays: number;
  submissionWarningDays: number;
  invoiceIntro: string;
  invoiceSubject: string;
  invoiceTitle: string;
  invoiceLabelTravelSingle: string;
  invoiceLabelTravelMultiple: string;
  invoiceLabelPreparation: string;
  invoiceLabelEvaluation: string;
  invoiceLabelTotalTime: string;
  invoiceLabelWriting: string;
  invoiceLabelKm: string;
  invoiceLabelPrinting: string;
  invoiceLabelShipping: string;
  invoiceLabelNet: string;
  invoiceLabelTax: string;
  invoiceLabelGross: string;
  invoiceFooter: string;
  jvegLastHash: string;
  jvegLastCheckFailed: string;
}
