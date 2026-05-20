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
export function formatNameLastFirst(fullName: string | undefined | null): string {
  if (!fullName) return "";
  
  const trimmedName = fullName.trim();
  if (!trimmedName) return "";

  // If already contains a comma, assume it's already Lastname, Firstname
  if (trimmedName.includes(",")) {
    const parts = trimmedName.split(",").map(p => p.trim());
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts.slice(1).join(" ")}`;
    }
    return trimmedName;
  }

  const parts = trimmedName.split(/\s+/);
  if (parts.length <= 1) return trimmedName;

  const prefixes = ["von", "van", "de", "der", "zu", "le", "la", "di", "da", "del", "du"];
  
  // Check if second to last part is a prefix
  if (parts.length >= 3 && prefixes.includes(parts[parts.length - 2].toLowerCase())) {
    const lastName = parts.slice(parts.length - 2).join(" ");
    const firstName = parts.slice(0, parts.length - 2).join(" ");
    return `${lastName}, ${firstName}`;
  }

  // Handle case like "von Mueller" (length 2, first word is prefix)
  if (parts.length === 2 && prefixes.includes(parts[0].toLowerCase())) {
    return trimmedName; // Return as is, or maybe "von Mueller, "? Probably just as is.
  }

  // Default: last part is last name
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, parts.length - 1).join(" ");
  return `${lastName}, ${firstName}`;
}
