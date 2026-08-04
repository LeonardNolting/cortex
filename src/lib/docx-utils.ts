import { 
  AlignmentType, 
  Paragraph, 
  TextRun, 
  TableRow, 
  TableCell, 
  VerticalAlign, 
  WidthType, 
  BorderStyle,
  IRunOptions,
  IParagraphOptions
} from "docx";

export const COL1 = 4800;  // description
export const COL2 = 1600;  // quantity
export const COL3 = 1800;  // rate
export const COL4 = 1438;  // amount (right aligned)
export const CONTENT_WIDTH = COL1 + COL2 + COL3 + COL4;

export function run(text: string, options: IRunOptions = {}): TextRun {
  return new TextRun({ font: "Arial", size: 22, ...options, text });
}

export function cellParagraph(options: IParagraphOptions = {}): Paragraph {
  return new Paragraph({ spacing: { before: 0, after: 0 }, ...options });
}

export function baseCell(content: Paragraph | Paragraph[], width: number, borderTop = false) {
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

export function row(c1: string, c2: string, c3: string, c4: string, bold = false, borderTop = false) {
  return new TableRow({
    children: [
      baseCell(cellParagraph({ children: [run(c1, { bold })] }), COL1, borderTop),
      baseCell(cellParagraph({ children: [run(c2)] }), COL2, borderTop),
      baseCell(cellParagraph({ children: [run(c3)] }), COL3, borderTop),
      baseCell(cellParagraph({ alignment: AlignmentType.RIGHT, children: [run(c4, { bold })] }), COL4, borderTop),
    ],
  });
}

export function rowMulti(lines: string[], quantity: string) {
  return new TableRow({
    children: [
      baseCell(lines.map(line => new Paragraph({ children: [run(line)] })), COL1),
      baseCell(cellParagraph({ children: [run(quantity)] }), COL2),
      baseCell(cellParagraph(), COL3),
      baseCell(cellParagraph({ alignment: AlignmentType.RIGHT }), COL4),
    ],
  });
}
