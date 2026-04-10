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

    let rates: ParsedRates = {};

    // First attempt: DOM-based parsing (most reliable for structured data)
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${extractedHtml}</div>`, "text/html");
      const tables = doc.querySelectorAll("table");

      tables.forEach(table => {
        const rows = table.querySelectorAll("row, tr");
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll("entry, td, th"));
          if (cells.length >= 2) {
            // Check first few cells for M1/M2/M3
            for (let cellIdx = 0; cellIdx < Math.min(cells.length, 3); cellIdx++) {
              const cellText = (cells[cellIdx].textContent || "").trim();
              const mMatch = cellText.match(/^\s*(M\s*[1-9])\s*$/i);
              
              if (mMatch) {
                const groupName = mMatch[1].replace(/\s+/g, '').toUpperCase();
                
                // Find the last cell that contains a number
                for (let i = cells.length - 1; i > cellIdx; i--) {
                  const valText = (cells[i].textContent || "").trim();
                  const numMatch = valText.match(/^\d+(?:,\d+)?$/);
                  if (numMatch) {
                    const val = parseFloat(numMatch[0].replace(',', '.'));
                    if (val > 0 && val < 1000) {
                      rates[groupName] = val;
                      break;
                    }
                  }
                }
                break; // Found group in this row, move to next row
              }
            }
          }
        });
      });
    } catch (domErr) {
      console.warn("DOMParser failed, falling back to Regex", domErr);
    }

    // Second attempt: Regex-based fallback (if DOM parsing failed or missed groups)
    if (!rates["M1"] || !rates["M2"] || !rates["M3"]) {
      // Look for patterns like <row>...M 1...</entry>...<entry>87</entry>...</row>
      const rowRegex = /<(row|tr)[^>]*>(.*?)<\/\1>/gs;
      const cellRegex = /<(entry|td|th)[^>]*>(.*?)<\/\1>/gs;
      
      let match;
      while ((match = rowRegex.exec(extractedHtml)) !== null) {
        const rowContent = match[2];
        const cells = Array.from(rowContent.matchAll(cellRegex));
        
        if (cells.length >= 2) {
          for (let cellIdx = 0; cellIdx < Math.min(cells.length, 3); cellIdx++) {
            const cellText = cells[cellIdx][2].replace(/<[^>]*>/g, '').trim();
            const mMatch = cellText.match(/^\s*(M\s*[1-9])\s*$/i);
            
            if (mMatch) {
              const groupName = mMatch[1].replace(/\s+/g, '').toUpperCase();
              if (rates[groupName]) continue;

              for (let i = cells.length - 1; i > cellIdx; i--) {
                const valText = cells[i][2].replace(/<[^>]*>/g, '').trim();
                const numMatch = valText.match(/^\d+(?:,\d+)?$/);
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
        }
      }
    }

    // Final validation
    if (rates["M1"] && rates["M2"] && rates["M3"]) {
      return rates;
    }

    console.warn("Failed to find all M-groups in JVEG HTML. Found:", rates);
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
