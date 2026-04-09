import { Assignment } from "../types";

export const SAMPLE_ASSIGNMENTS: Assignment[] = [
  {
    id: 1,
    invoiceNumber: "ZZK260401",
    patientName: "Max Mustermann",
    patientBirthdate: "01.01.1980",
    fileNumber: "123 Js 456/26",
    courtId: 1,
    remunerationGroupId: 2, // Assuming M2
    travelCount: 1,
    court: "Landgericht Berlin",
    remunerationGroup: "M2",
    status: "Offen",
    createdAt: "2026-04-01",
    printingPages: 10,
  },
  {
    id: 2,
    invoiceNumber: "ZZK260402",
    patientName: "Erika Mustermann",
    patientBirthdate: "15.05.1975",
    fileNumber: "789 C 101/26",
    courtId: 2,
    remunerationGroupId: 3, // Assuming M3
    court: "Amtsgericht München",
    remunerationGroup: "M3",
    status: "In Bearbeitung",
    createdAt: "2026-04-02",
    printingPages: 25,
  },
  {
    id: 3,
    invoiceNumber: "ZZK260315",
    patientName: "Hans Schmidt",
    patientBirthdate: "20.11.1990",
    fileNumber: "234 O 567/26",
    courtId: 3,
    remunerationGroupId: 2, // Assuming M2
    court: "Landgericht Hamburg",
    remunerationGroup: "M2",
    status: "Abgeschlossen",
    createdAt: "2026-03-15",
    printingPages: 5,
  },
];
