export interface ParsedRates {
  [key: string]: number; // e.g. "M1": 80, "M2": 90
}

export function parseHtmlForRates(jsonString: string): ParsedRates | null {
  try {
    const data = JSON.parse(jsonString);
    let extractedHtml = "";

    const traverse = (obj: any) => {
      if (typeof obj === "string" && (obj.includes("<table") || obj.includes("M 1") || obj.includes("M1"))) {
        extractedHtml += obj + "\n";
      } else if (typeof obj === "object" && obj !== null) {
        for (const key in obj) {
          traverse(obj[key]);
        }
      }
    };

    traverse(data);

    if (!extractedHtml) return null;

    const parser = new DOMParser();
    // Wrap in a div to ensure it parses as HTML fragment correctly
    const doc = parser.parseFromString(`<div>${extractedHtml}</div>`, "text/html");
    const tables = doc.querySelectorAll("table");

    let rates: ParsedRates = {};
    
    tables.forEach(table => {
      const rows = table.querySelectorAll("tr");
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll("td, th"));
        if (cells.length >= 2) {
          const textContent = row.textContent || "";
          // Look for M1, M2, M3 in the row, allowing for space e.g., "M 1"
          const mMatch = textContent.match(/\b(M\s*[1-9])\b/);
          if (mMatch) {
            const groupNameRaw = mMatch[1];
            // Normalize group name to "M1", "M2" etc.
            const groupName = groupNameRaw.replace(/\s+/g, '');
            
            // Find the last cell that contains a number
            for (let i = cells.length - 1; i >= 0; i--) {
              const cellText = (cells[i].textContent || "").trim();
              const numMatch = cellText.match(/^\d+(?:,\d+)?$/);
              if (numMatch) {
                const val = parseFloat(numMatch[0].replace(',', '.'));
                if (val > 0 && val < 1000) {
                  rates[groupName] = val;
                  break;
                }
              }
            }
          }
        }
      });
    });

    // Require at least M1, M2, M3 to be confident in the parsing
    if (rates["M1"] && rates["M2"] && rates["M3"]) {
      return rates;
    }

    return null;
  } catch (e) {
    console.error("Error parsing JVEG HTML", e);
    return null;
  }
}

export async function hashString(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
