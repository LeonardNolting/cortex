import {type IParagraphOptions, type IRunOptions, Table, TableCell, TableRow, VerticalAlign, WidthType} from "docx";
import {
    AlignmentType,
    Document,
    FrameAnchorType,
    HorizontalPositionAlign,
    Packer,
    Paragraph,
    TabStopType,
    TextRun,
    UnderlineType,
    VerticalPositionAlign,
    BorderStyle,
    TableBorders,
} from 'docx';
import {writeFile} from "fs/promises";
import open from "open";

const COL1 = 4800;  // description
const COL2 = 1600;  // quantity
const COL3 = 1800;  // rate
const COL4 = 1438;  // amount (right aligned)

const CONTENT_WIDTH = COL1 + COL2 + COL3 + COL4;

function run(options: IRunOptions): TextRun;
function run(text: string, options?: IRunOptions): TextRun;
function run(text: IRunOptions | string, options: IRunOptions | never = {}): TextRun {
    const finalOptions = typeof text === "string" ? {...options, text} : text;
    return new TextRun({font: "Arial", size: 22, ...finalOptions});
}

function cellParagraph(options: IParagraphOptions = {text: ""}): Paragraph {
    return new Paragraph({spacing: {before: 0, after: 0}, ...options})
}

function baseCell(content: Paragraph | Paragraph[], borderTop = false) {
    return new TableCell({
        verticalAlign: VerticalAlign.BOTTOM,
        margins: {top: 120, bottom: 120, left: 0, right: 0},
        borders: {
            top: borderTop ? {style: BorderStyle.SINGLE, size: 6, color: "000000"} : {style: BorderStyle.NONE},
            bottom: {style: BorderStyle.NONE},
            left: {style: BorderStyle.NONE},
            right: {style: BorderStyle.NONE},
        },
        children: Array.isArray(content) ? content : [content],
    });
}


function row(
    c1: string,
    c2: string,
    c3: string,
    c4: string,
    bold = false,
    borderTop = false,
) {
    return new TableRow({
        children: [
            baseCell(cellParagraph({children: [run(c1, {bold})]}), borderTop),
            baseCell(cellParagraph({children: [run(c2)]}), borderTop),
            baseCell(cellParagraph({children: [run(c3)]}), borderTop),
            baseCell(
                cellParagraph({
                    alignment: AlignmentType.RIGHT,
                    children: [run(c4, {bold})],
                }),
                borderTop
            ),
        ],
    });
}

function rowMulti(lines: string[], quantity: string) {
    return new TableRow({
        children: [
            baseCell(
                lines.map(line => new Paragraph({children: [run(line)]}))
            ),
            baseCell(cellParagraph({children: [run(quantity)]})),
            baseCell(cellParagraph()),
            baseCell(cellParagraph({alignment: AlignmentType.RIGHT})),
        ],
    });
}


const doc = new Document({
    styles: {
        default: {
            document: {
                run: {font: "Arial", size: 22}
            }
        }
    },
    sections: [{
        properties: {
            page: {
                size: {width: 11906, height: 16838},
                margin: {top: 1134, right: 1134, bottom: 1134, left: 1134},
            }
        },
        children: [
            // Sender info
            new Paragraph({children: [run("Dr. C. N.")]}),
            new Paragraph({children: [run("Am Berg 75")]}),
            new Paragraph({children: [run("12345 Schönweitoben")]}),
            new Paragraph({children: [run("geb. 02.02.2022")]}),
            new Paragraph({children: [run("Steuer ID: 90 898 767 545")]}),
            new Paragraph({children: []}),

            // Recipient + date
            new Paragraph({children: [run("Amtsgericht Sonnenstrahl")]}),
            new Paragraph({children: [run("- Abteilung für Betreuungssachen -")]}),
            new Paragraph({children: [run("Süßigkeitenstraße 99")]}),
            new Paragraph({
                tabStops: [{type: TabStopType.RIGHT, position: CONTENT_WIDTH}],
                children: [
                    run("98765 Sonnenstrahl"),
                    run({text: "\t", font: "Arial", size: 22}),
                    run("Höchstadt, 03.03.2025"),
                ]
            }),
            new Paragraph({children: []}),

            // Invoice number - italic
            new Paragraph({children: [run("Rechnungsnummer ZZK251211", {italics: true})]}),
            new Paragraph({children: []}),
            new Paragraph({children: []}),

            // Subject - centered, bold
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [run("Andrea Zimmermann, geb. am 05.02.1912, Aktenzeichen: 023 XVII 55/12", {bold: true})]
            }),
            new Paragraph({children: []}),

            // Title - centered, bold
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [run("Vergütungsantrag", {bold: true})]
            }),
            new Paragraph({children: []}),
            new Paragraph({children: []}),

            // Intro - first line justified
            new Paragraph({
                alignment: AlignmentType.BOTH,
                children: [run("Für die Erstellung eines psychiatrischen Gutachtens erlaube ich mir bei gemäß Vergütungsgruppe {{vergütungsgruppe}} zu berechnen:")]
            }),
            new Paragraph({children: []}),

            new Table({
                width: {
                    size: CONTENT_WIDTH,
                    type: WidthType.DXA,
                },
                columnWidths: [COL1, COL2, COL3, COL4],

                borders: {
                    top: {style: BorderStyle.NONE, size: 0, color: "FFFFFF"},
                    bottom: {style: BorderStyle.NONE, size: 0, color: "FFFFFF"},
                    left: {style: BorderStyle.NONE, size: 0, color: "FFFFFF"},
                    right: {style: BorderStyle.NONE, size: 0, color: "FFFFFF"},
                    insideHorizontal: {style: BorderStyle.NONE, size: 0, color: "FFFFFF"},
                    insideVertical: {style: BorderStyle.NONE, size: 0, color: "FFFFFF"},
                },

                rows: [

                    // -----------------------------
                    // POSITION ROWS
                    // -----------------------------

                    row("Anfahrten (2x, davon 1x Mini-Anteil):", "80 Minuten", "", ""),
                    rowMulti(
                        [
                            "Exploration, Fremdanamnese",
                            "und Durchsicht der Unterlagen:",
                        ],
                        "304 Minuten"
                    ),
                    rowMulti(
                        [
                            "Auswertung der Untersuchung und",
                            "der neuropsycholog. Testung,",
                            "Verfassen des Gutachtens:",
                        ],
                        "192 Minuten"
                    ),

                    row("Gesamtzeit:", "576 Minuten", "(600 Minuten)", "900,00 €"),
                    row("Schreibgebühr:", "27.733", "à 1,50 €/1000", "42,00 €"),
                    row("Kilometerpauschale:", "76 km", "à 0,42 €/km", "31,92 €"),

                    // -----------------------------
                    // TOTALS
                    // -----------------------------

                    row("Versandkosten:", "", "", "2,00 €"),
                    row("Gesamt:", "", "", "975,92 €", undefined, true),
                    row("Umsatzsteuer 19%:", "", "", "185,42 €"),
                    row("Gesamt:", "", "", "1161,34 €", true),
                ],
            }),

            new Paragraph({
                children: [run("Dr. C. Nolting")],
                spacing: {before: 360 * 2, after: 60},
            }),


            // --- STICKY FOOTER SECTION ---
            new Paragraph({
                frame: {
                    type: "alignment",
                    anchor: {
                        horizontal: FrameAnchorType.MARGIN,
                        vertical: FrameAnchorType.MARGIN,
                    },
                    alignment: {
                        x: HorizontalPositionAlign.LEFT,
                        y: VerticalPositionAlign.BOTTOM,
                    },
                    width: CONTENT_WIDTH,
                    height: 10,
                },
                children: [
                    run("Ich bitte um Überweisung unter Angabe der Rechnungsnummer auf folgendes Konto:"),
                    run({break: 1.5}),
                    run("Frau Dr. C. Nolting, Stadt- und Kreissparkasse Erlangen,"),
                    run({break: 1.5}),
                    run("IBAN: DE46 7635 0000 0060 1113 31, BIC: BYLADEM1ERH"),
                ],
            }),
        ]
    }]
});

const buffer = await Packer.toBuffer(doc);
await writeFile("rechnung.docx", buffer);
await open('rechnung.docx');
console.log("Done");