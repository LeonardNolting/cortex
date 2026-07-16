/**
 * Robustly parses a full name into "Lastname, Firstname" format.
 * 
 * Handles:
 * - "Firstname Lastname" -> "Lastname, Firstname"
 * - "Lastname, Firstname" -> "Lastname, Firstname" (already correct)
 * - "Firstname von Lastname" -> "von Lastname, Firstname"
 * - Multiple first names: "Hans Peter Mueller" -> "Mueller, Hans Peter"
 * - Titles: "Dr. Hans Mueller" -> "Mueller, Dr. Hans" (or should title be handled differently? Usually titles go with first name in "Lastname, Firstname" lists)
 */
export interface FormatNameOptions {
  includeTitles?: boolean;
  includeFirstName?: boolean;
}

export function formatNameLastFirst(fullName: string | undefined | null, options: FormatNameOptions = {}): string {
  const { includeTitles = true, includeFirstName = true } = options;
  if (!fullName) return "";
  
  const trimmedName = fullName.trim();
  if (!trimmedName) return "";

  const extractTitles = (parts: string[]): { titles: string[], remaining: string[] } => {
    const titles: string[] = [];
    let nameStartIndex = 0;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i].toLowerCase();
      if (parts[i].endsWith(".") || ["dr", "prof", "pd"].includes(p)) {
        titles.push(parts[i]);
        nameStartIndex = i + 1;
      } else {
        break;
      }
    }
    return { titles, remaining: parts.slice(nameStartIndex) };
  };

  // If already contains a comma, assume it's already Lastname, Firstname
  if (trimmedName.includes(",")) {
    const commaParts = trimmedName.split(",").map(p => p.trim());
    if (commaParts.length >= 2) {
      let lastName = commaParts[0];
      let firstName = commaParts.slice(1).join(" ");
      
      const lastNameParts = lastName.split(/\s+/);
      const { titles: lastTitles, remaining: lastRemaining } = extractTitles(lastNameParts);
      lastName = lastRemaining.join(" ");

      const firstParts = firstName.split(/\s+/);
      const { titles: firstTitles, remaining: firstRemaining } = extractTitles(firstParts);
      
      const allTitles = [...lastTitles, ...firstTitles];
      
      if (allTitles.length > 0 && includeTitles) {
        lastName = `${allTitles.join(" ")} ${lastName}`;
      }
      firstName = firstRemaining.join(" ");
      
      return includeFirstName && firstName ? `${lastName}, ${firstName}` : lastName;
    }
    return includeTitles ? trimmedName : trimmedName; // Fallback
  }

  const parts = trimmedName.split(/\s+/);
  if (parts.length <= 1) return trimmedName;

  const { titles, remaining: remainingParts } = extractTitles(parts);
  const titleStr = includeTitles && titles.length > 0 ? `${titles.join(" ")} ` : "";

  if (remainingParts.length <= 1) {
      return includeTitles ? trimmedName : remainingParts.join(" ");
  }

  const prefixes = ["von", "van", "de", "der", "zu", "le", "la", "di", "da", "del", "du"];
  
  // Check if second to last part is a prefix
  if (remainingParts.length >= 3 && prefixes.includes(remainingParts[remainingParts.length - 2].toLowerCase())) {
    const lastName = remainingParts.slice(remainingParts.length - 2).join(" ");
    const firstName = remainingParts.slice(0, remainingParts.length - 2).join(" ");
    return includeFirstName && firstName 
      ? `${titleStr}${lastName}, ${firstName}` 
      : `${titleStr}${lastName}`;
  }

  // Handle case like "von Mueller" (length 2, first word is prefix)
  if (remainingParts.length === 2 && prefixes.includes(remainingParts[0].toLowerCase())) {
    return `${titleStr}${remainingParts.join(" ")}`; 
  }

  // Default: last part is last name
  const lastName = remainingParts[remainingParts.length - 1];
  const firstName = remainingParts.slice(0, remainingParts.length - 1).join(" ");
  return includeFirstName && firstName 
    ? `${titleStr}${lastName}, ${firstName}` 
    : `${titleStr}${lastName}`;
}
