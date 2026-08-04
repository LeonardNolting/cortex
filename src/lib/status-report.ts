import { Assignment, Court, Settings } from "../types";
import { formatDate } from "./utils";
import { formatNameLastFirst } from "./utils/name-parser";
import { Document, Packer, Paragraph, TabStopType, AlignmentType } from "docx";
import { run, CONTENT_WIDTH } from "./docx-utils";

export interface StatusReportData {
  assignment: Assignment;
  court: Court;
  settings: Settings;
  submissionDate: string;
  explored: boolean;
  greeting: string;
  certainty: 'high' | 'medium' | 'low';
}

export async function generateStatusReportDocx(data: StatusReportData): Promise<Uint8Array> {
  const { assignment, court, settings, submissionDate, explored, greeting, certainty } = data;
  
  const formattedSubmissionDate = formatDate(submissionDate);
  const dateStr = new Date().toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });

  let certaintyText = "werden voraussichtlich";
  if (certainty === 'high') certaintyText = "werden sicher";
  if (certainty === 'low') certaintyText = "können möglicherweise";

  let bodyParagraphs = [
    new Paragraph({ children: [run(`${greeting || 'Sehr geehrte'} Damen und Herren,`)] }),
    new Paragraph({ children: [] }),
    new Paragraph({
      children: [
        run(`in der Betreuungssache betreffend ${formatNameLastFirst(assignment.patientName, { includeTitles: false, includeComma: false })} `),
        run(`(Az.: ${assignment.fileNumber}) `),
        run(`teile ich Ihnen mit, dass das Gutachten ${certaintyText} bis zum ${formattedSubmissionDate} fertiggestellt wird.`)
      ]
    }),
  ];

  if (explored) {
    bodyParagraphs.push(new Paragraph({ children: [] }));
    bodyParagraphs.push(new Paragraph({ children: [run("Die psychiatrische Exploration des Betroffenen hat bereits stattgefunden.")] }));
  }

  bodyParagraphs.push(new Paragraph({ children: [] }));
  bodyParagraphs.push(new Paragraph({ children: [run("Mit freundlichen Grüßen")] }));
  bodyParagraphs.push(new Paragraph({ children: [] }));
  bodyParagraphs.push(new Paragraph({ children: [] }));
  bodyParagraphs.push(new Paragraph({ children: [run(settings.userName || "")] }));

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
        ...(court.showBirthday ? [new Paragraph({ children: [run(`geb. ${settings.userBirthday || ""}`)] })] : []),
        ...(court.showTaxId ? [new Paragraph({ children: [run(`Steuer ID: ${settings.userTaxId || ""}`)] })] : []),
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
            run(`${settings.userCity}, ${dateStr}`),
          ]
        }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),

        // Subject
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [run("Sachstandsmitteilung", { bold: true })]
        }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] }),

        // Body
        ...bodyParagraphs
      ]
    }]
  });

  return new Uint8Array(await Packer.toArrayBuffer(doc));
}
