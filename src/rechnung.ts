// invoice.ts
import {
    AlignmentType,
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";
import * as fs from "fs";
import {BaseDirectory, create, writeFile} from "@tauri-apps/plugin-fs";

/* =========================
   Types
========================= */

export interface Address {
    name: string;
    street: string;
    zipCity: string;
    extraLines?: string[];
}

export interface ServiceRow {
    description: string;
    value: string; // keep formatted (e.g. "80 Minuten")
    amount?: string; // optional price column
}

export interface TotalsRow {
    label: string;
    value: string;
}

export interface BankDetails {
    accountHolder: string;
    bank: string;
    iban: string;
    bic: string;
}

export interface InvoiceData {
    sender: Address & {
        birthDate?: string;
        taxId?: string;
    };

    recipient: Address;

    placeAndDate: string;
    invoiceNumber: string;

    referencePerson: string;
    referenceDetails: string;

    introText: string;

    serviceRows: ServiceRow[];

    totals: TotalsRow[];

    signatureName: string;

    bankDetails: BankDetails;
}

/* =========================
   Helper
========================= */

function addressToParagraph(address: Address): Paragraph[] {
    return [
        new Paragraph(address.name),
        new Paragraph(address.street),
        new Paragraph(address.zipCity),
        ...(address.extraLines ?? []).map((l) => new Paragraph(l)),
    ];
}

/* =========================
   Main Generator
========================= */

export async function generateInvoice(
    data: InvoiceData,
    outputPath: string
) {
    const serviceTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: data.serviceRows.map(
            (row) =>
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 70, type: WidthType.PERCENTAGE },
                            children: [new Paragraph(row.description)],
                        }),
                        new TableCell({
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    text: row.value,
                                    alignment: AlignmentType.RIGHT,
                                }),
                            ],
                        }),
                    ],
                })
        ),
    });

    const totalsTable =
        data.totals.length > 0
            ? new Table({
                width: { size: 50, type: WidthType.PERCENTAGE },
                alignment: AlignmentType.RIGHT,
                rows: data.totals.map(
                    (row) =>
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph(row.label)],
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            text: row.value,
                                            alignment: AlignmentType.RIGHT,
                                        }),
                                    ],
                                }),
                            ],
                        })
                ),
            })
            : undefined;

    const doc = new Document({
        sections: [
            {
                children: [
                    /* ===== Header Block ===== */

                    ...addressToParagraph(data.sender),
                    new Paragraph(""),
                    new Paragraph(
                        `geb. ${data.sender.birthDate ?? ""}`
                    ),
                    new Paragraph(
                        `Steuer ID: ${data.sender.taxId ?? ""}`
                    ),

                    new Paragraph(""),

                    ...addressToParagraph(data.recipient),

                    new Paragraph({
                        text: data.placeAndDate,
                        alignment: AlignmentType.RIGHT,
                    }),

                    new Paragraph(""),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Rechnungsnummer ${data.invoiceNumber}`,
                                bold: true,
                            }),
                        ],
                    }),

                    new Paragraph(""),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: data.referencePerson,
                                bold: true,
                            }),
                        ],
                    }),

                    new Paragraph(data.referenceDetails),

                    new Paragraph(""),
                    new Paragraph({
                        children: [new TextRun({ text: "Liquidation", bold: true })],
                    }),

                    new Paragraph(""),
                    new Paragraph(data.introText),

                    new Paragraph(""),

                    /* ===== Services ===== */

                    serviceTable,

                    new Paragraph(""),
                    ...(totalsTable ? [totalsTable] : []),

                    new Paragraph(""),
                    new Paragraph(""),
                    new Paragraph(data.signatureName),

                    /* ===== Spacer to push bottom section ===== */
                    new Paragraph({
                        spacing: { before: 600 }, // tweak if needed
                    }),

                    /* ===== Bottom Section ===== */

                    new Paragraph(
                        "Ich bitte um Überweisung unter Angabe der Rechnungsnummer auf folgendes Konto:"
                    ),

                    new Paragraph(""),

                    new Paragraph(
                        `${data.bankDetails.accountHolder}, ${data.bankDetails.bank}`
                    ),
                    new Paragraph(`IBAN: ${data.bankDetails.iban}`),
                    new Paragraph(`BIC: ${data.bankDetails.bic}`),
                ],
            },
        ],
    });

    console.log("Saving to ", outputPath, "")

    const blob = await Packer.toBlob(doc);
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await writeFile(outputPath, uint8Array, {
        baseDir: BaseDirectory.AppData,
    });
}
