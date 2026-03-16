export function parseLocalizedNumber(value: string): number {
  if (!value) return 0;

  const normalized = value
    .trim()
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}