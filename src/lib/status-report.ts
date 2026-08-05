import { Assignment, Court, Settings } from "../types";
import { formatDate } from "./utils";
import { formatNameLastFirst } from "./utils/name-parser";
import { Document, Packer, Paragraph, TabStopType, AlignmentType } from "docx";
import { run, CONTENT_WIDTH } from "./docx-utils";
import Handlebars from "handlebars";

Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

const defaultStatusReportTemplate = `{{#if greeting}}{{greeting}}{{else}}Sehr geehrte{{/if}} Damen und Herren,

in der Betreuungssache betreffend {{formatName assignment.patientName includeTitles=false includeComma=false}} (Az.: {{assignment.fileNumber}}) teile ich Ihnen mit, dass das Gutachten {{#if (eq certainty "high")}}werden sicher{{else}}{{#if (eq certainty "low")}}können möglicherweise{{else}}werden voraussichtlich{{/if}}{{/if}} bis zum {{formattedSubmissionDate}} fertiggestellt wird.
{{#if explored}}

Die psychiatrische Exploration des Betroffenen hat bereits stattgefunden.{{/if}}

Mit freundlichen Grüßen


{{settings.userName}}`;


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

  const templateContext = {
    assignment,
    court,
    settings,
    submissionDate,
    formattedSubmissionDate,
    explored,
    greeting,
    certainty
  };

  const compile = Handlebars.compile(settings.statusReportTemplate || defaultStatusReportTemplate);
  const compiledText = compile(templateContext);

  const bodyParagraphs = compiledText.split('\n').map((line) => {
    return new Paragraph({ children: line ? [run(line)] : [] });
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
