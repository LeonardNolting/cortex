export function parseGermanNumber(str: string): number {
  if (!str) return 0;
  const value = parseFloat(str.replace(',', '.'));
  return isNaN(value) ? 0 : value;
}

export function formatToGermanString(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0";
  const numStr = String(num);
  // Ensure it has at least one decimal place for integers if it's for currency/rates.
  // For now, a simple replace is enough.
  return numStr.replace('.', ',');
}
