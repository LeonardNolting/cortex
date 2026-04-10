import { Assignment, Court, RemunerationGroup, Settings } from "../types";
import Handlebars from "handlebars";
import { 
  AlignmentType, 
  Document, 
  Packer, 
  Paragraph, 
  TabStopType, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  Header,
  VerticalAlign, 
  WidthType, 
  BorderStyle,
  FrameAnchorType,
  HorizontalPositionAlign,
  VerticalPositionAlign,
  IRunOptions,
  IParagraphOptions
} from "docx";

export interface InvoiceData {
  assignment: Assignment;
  court: Court;
  remunerationGroup: RemunerationGroup;
  settings: Settings;
  invoiceNumber: string;
  printingDate: string;
}

export interface CalculatedValues {
  totalMinutes: number;
  roundedMinutes: number;
  timeEuro: number;
  writingEuro: number;
  printingEuro: number;
  kmEuro: number;
  shippingEuro: number;
  netEuro: number;
  taxEuro: number;
  grossEuro: number;
  // Persistent rates
  remunerationGroupValue: number;
  writingFeeRate: number;
  printingFeeRate: number;
  kmFeeRate: number;
  taxRate: number;
}

export function calculateInvoiceValues(data: InvoiceData): CalculatedValues {
  const { assignment, remunerationGroup, settings } = data;
  const travelCount = assignment.travelCount || 1;
  
  // Use persisted rates if available, otherwise use current ones
  const remunerationGroupValue = assignment.remunerationGroupValue ?? remunerationGroup.value;
  const writingFeeRate = assignment.writingFeeRate ?? settings.writingFee ?? 1.5;
  const printingFeeRate = assignment.printingFeeRate ?? settings.printingFee ?? 0.5;
  const kmFeeRate = assignment.kmFeeRate ?? settings.kmFee ?? 0.42;
  const taxRatePercent = assignment.taxRate ?? settings.taxRate ?? 19;
  
  const totalMinutes = ((assignment.travelTime || 0) * travelCount) + 
                       (assignment.preparationTime || 0) + 
                       (assignment.evaluationTime || 0);
  
  const roundedMinutes = Math.ceil(totalMinutes / 30) * 30;
  const timeEuro = (roundedMinutes / 60) * remunerationGroupValue;
  
  const writingEuro = Math.round(Math.ceil((assignment.writingCharacters || 0) / 1000) * writingFeeRate * 100) / 100;
  const printingEuro = Math.round((assignment.printingPages || 0) * printingFeeRate * 100) / 100;
  const kmEuro = Math.round((assignment.kmCount || 0) * travelCount * kmFeeRate * 100) / 100;
  const shippingEuro = Math.round((assignment.shippingFee || 0) * 100) / 100;
  
  const netEuro = Math.round((timeEuro + writingEuro + printingEuro + kmEuro + shippingEuro) * 100) / 100;
  
  // Tax rounding: Using standard 2 decimal places precision for better accuracy.
  const taxRate = taxRatePercent / 100;
  const taxEuro = Math.round(netEuro * taxRate * 100) / 100;
  
  const grossEuro = Math.round((netEuro + taxEuro) * 100) / 100;
  
  return {
    totalMinutes,
    roundedMinutes,
    timeEuro,
    writingEuro,
    printingEuro,
    kmEuro,
    shippingEuro,
    netEuro,
    taxEuro,
    grossEuro,
    remunerationGroupValue,
    writingFeeRate,
    printingFeeRate,
    kmFeeRate,
    taxRate: taxRatePercent
  };
}

export function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

const COL1 = 4800;  // description
const COL2 = 1600;  // quantity
const COL3 = 1800;  // rate
const COL4 = 1438;  // amount (right aligned)
const CONTENT_WIDTH = COL1 + COL2 + COL3 + COL4;

function run(text: string, options: IRunOptions = {}): TextRun {
  return new TextRun({ font: "Arial", size: 22, ...options, text });
}

function cellParagraph(options: IParagraphOptions = {}): Paragraph {
  return new Paragraph({ spacing: { before: 0, after: 0 }, ...options });
}

function baseCell(content: Paragraph | Paragraph[], width: number, borderTop = false) {
  return new TableCell({
    verticalAlign: VerticalAlign.BOTTOM,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 120, bottom: 120, left: 0, right: 0 },
    borders: {
      top: borderTop ? { style: BorderStyle.SINGLE, size: 6, color: "000000" } : { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    children: Array.isArray(content) ? content : [content],
  });
}

function row(c1: string, c2: string, c3: string, c4: string, bold = false, borderTop = false) {
  return new TableRow({
    children: [
      baseCell(cellParagraph({ children: [run(c1, { bold })] }), COL1, borderTop),
      baseCell(cellParagraph({ children: [run(c2)] }), COL2, borderTop),
      baseCell(cellParagraph({ children: [run(c3)] }), COL3, borderTop),
      baseCell(cellParagraph({ alignment: AlignmentType.RIGHT, children: [run(c4, { bold })] }), COL4, borderTop),
    ],
  });
}

function rowMulti(lines: string[], quantity: string) {
  return new TableRow({
    children: [
      baseCell(lines.map(line => new Paragraph({ children: [run(line)] })), COL1),
      baseCell(cellParagraph({ children: [run(quantity)] }), COL2),
      baseCell(cellParagraph(), COL3),
      baseCell(cellParagraph({ alignment: AlignmentType.RIGHT }), COL4),
    ],
  });
}

export async function generateInvoiceDocx(data: InvoiceData): Promise<Uint8Array> {
  const values = calculateInvoiceValues(data);
  const { assignment, court, remunerationGroup, settings, invoiceNumber, printingDate } = data;

  // Template context
  const context = {
    assignment,
    court,
    remunerationGroup,
    settings: {
      ...settings,
      taxRate: values.taxRate,
      kmFee: values.kmFeeRate,
      writingFee: values.writingFeeRate,
      printingFee: values.printingFeeRate
    },
    values,
    invoiceNumber,
    printingDate: new Date(printingDate).toLocaleDateString("de-DE")
  };

  const compile = (template: string) => Handlebars.compile(template || "")(context);

  const introText = compile(settings.invoiceIntro);
  const subjectText = compile(settings.invoiceSubject);
  const titleText = compile(settings.invoiceTitle);
  const footerText = compile(settings.invoiceFooter);
  
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22 }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
        }
      },
      children: [
        // Sender info
        new Paragraph({ children: [run(settings.userName || "")] }),
        new Paragraph({ children: [run(settings.userStreet || "")] }),
        new Paragraph({ children: [run(`${settings.userZip || ""} ${settings.userCity || ""}`)] }),
        new Paragraph({ children: [run(`geb. ${settings.userBirthday || ""}`)] }),
        new Paragraph({ children: [run(`Steuer ID: ${settings.userTaxId || ""}`)] }),
        new Paragraph({ children: [] }),

        // Recipient + date
        new Paragraph({ children: [run(court.name)] }),
        new Paragraph({ children: [run(`- ${court.department} -`)] }),
        new Paragraph({ children: [run(court.street)] }),
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
          children: [
            run(`${court.zip} ${court.city}`),
            run("\t"),
            run(`${settings.userCity}, ${context.printingDate}`),
          ]
        }),
        new Paragraph({ children: [] }),

        // Invoice number
        new Paragraph({ children: [run(`Rechnungsnummer ${invoiceNumber}`, { italics: true })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),

        // Subject
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [run(subjectText, { bold: true })]
        }),
        new Paragraph({ children: [] }),

        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [run(titleText, { bold: true })]
        }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),

        // Intro
        new Paragraph({
          alignment: AlignmentType.BOTH,
          children: [run(introText)]
        }),
        new Paragraph({ children: [] }),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [COL1, COL2, COL3, COL4],
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          },
          rows: [
            row(
              assignment.travelCount === 1 ? (settings.invoiceLabelTravelSingle || "Anfahrt:") : (settings.invoiceLabelTravelMultiple || "Anfahrten:"),
              `${((assignment.travelTime || 0) * (assignment.travelCount || 1)).toLocaleString("de-DE")} Minuten`,
              assignment.travelCount !== 1 ? `(${(assignment.travelCount || 1).toLocaleString("de-DE")} x ${assignment.travelTime || 0} Min.)` : "",
              ""
            ),
            rowMulti(
              (settings.invoiceLabelPreparation || "Exploration, Fremdanamnese\nund Durchsicht der Unterlagen:").split("\n"),
              `${assignment.preparationTime || 0} Minuten`
            ),
            rowMulti(
              (settings.invoiceLabelEvaluation || "Auswertung der Untersuchung und\nder neuropsycholog. Testung,\nVerfassen des Gutachtens:").split("\n"),
              `${assignment.evaluationTime || 0} Minuten`
            ),
            row(settings.invoiceLabelTotalTime || "Gesamtzeit:", `${values.totalMinutes} Minuten`, `(${values.roundedMinutes} Minuten)`, formatEuro(values.timeEuro)),
            row(settings.invoiceLabelWriting || "Schreibgebühr:", (assignment.writingCharacters || 0).toLocaleString("de-DE"), `à ${formatEuro(values.writingFeeRate)}/1000`, formatEuro(values.writingEuro)),
            row(settings.invoiceLabelKm || "Kilometerpauschale:", `${((assignment.kmCount || 0) * (assignment.travelCount || 1)).toLocaleString("de-DE")} km`, `à ${formatEuro(values.kmFeeRate)}/km`, formatEuro(values.kmEuro)),
            ...(assignment.printingPages ? [row(settings.invoiceLabelPrinting || "Kopierkosten:", `${assignment.printingPages} Seiten`, `à ${formatEuro(values.printingFeeRate)}/Seite`, formatEuro(values.printingEuro))] : []),
            row(settings.invoiceLabelShipping || "Versandkosten:", "", "", formatEuro(values.shippingEuro)),
            row(settings.invoiceLabelNet || "Gesamt (Netto):", "", "", formatEuro(values.netEuro), undefined, true),
            row(compile(settings.invoiceLabelTax || "Umsatzsteuer {{settings.taxRate}}%:"), "", "", formatEuro(values.taxEuro)),
            row(settings.invoiceLabelGross || "Gesamt (Brutto):", "", "", formatEuro(values.grossEuro), true),
          ],
        }),

        new Paragraph({
          children: [run(settings.userName || "")],
          spacing: { before: 360 * 2, after: 60 },
        }),

        // Footer
        new Paragraph({
          frame: {
            type: "alignment",
            anchor: { horizontal: FrameAnchorType.MARGIN, vertical: FrameAnchorType.MARGIN },
            alignment: { x: HorizontalPositionAlign.LEFT, y: VerticalPositionAlign.BOTTOM },
            width: CONTENT_WIDTH,
            height: 10,
          },
          children: footerText.split("\n").flatMap((line, i) => {
            return [run(line, { break: i > 0 ? 1 : 0 })];
          }),
        }),
      ]
    }]
  });

  return new Uint8Array(await Packer.toArrayBuffer(doc));
}

export async function generateIncomeTaxDocx(
  assignments: Assignment[],
  settings: Settings,
  month: number,
  year: number
): Promise<Uint8Array> {
  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];
  const monthName = monthNames[month - 1];

  const assignmentsWithAmount = assignments.filter((a) => (a.grossEuro || 0) !== 0);

  const tableRows = assignmentsWithAmount.map(a => {
    const dateStr = a.paidAt ? new Date(a.paidAt).toLocaleDateString("de-DE") : "-";
    const amountStr = formatEuro(a.grossEuro || 0);
    
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [run(dateStr)] })],
          margins: { top: 120, bottom: 120, left: 120, right: 120 },
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [run(amountStr)] })],
          margins: { top: 120, bottom: 120, left: 120, right: 120 },
        }),
      ]
    });
  });

  const totalAmount = Math.round(assignmentsWithAmount.reduce((sum, a) => sum + (a.grossEuro || 0), 0) * 100) / 100;
  const totalRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [run("Gesamt", { bold: true })] })],
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        borders: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
      }),
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [run(formatEuro(totalAmount), { bold: true })] })],
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        borders: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
      }),
    ]
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22 }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
        }
      },
      headers: {
        default: new Header({
          children: [
            // Header Line 1: Examiner's name and address
            new Paragraph({ 
              children: [
                run(`${settings.userName}, ${settings.userStreet}, ${settings.userZip} ${settings.userCity}`)
              ] 
            }),
            // Header Line 2: Einnahmen inkl. Mwst. [month and year in German]
            new Paragraph({ 
              children: [
                run(`Einnahmen inkl. Mwst. ${monthName} ${year}`, { bold: true })
              ],
              spacing: { before: 240, after: 480 }
            }),
          ],
        }),
      },
      children: [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [run("Datum", { bold: true })] })],
                  margins: { top: 120, bottom: 120, left: 120, right: 120 },
                  shading: { fill: "F0F0F0" },
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [run("Betrag", { bold: true })] })],
                  margins: { top: 120, bottom: 120, left: 120, right: 120 },
                  shading: { fill: "F0F0F0" },
                }),
              ]
            }),
            ...tableRows,
            totalRow
          ]
        })
      ]
    }]
  });

  return new Uint8Array(await Packer.toArrayBuffer(doc));
}
