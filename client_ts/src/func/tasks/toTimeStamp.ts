export default function toTimestamp(value: unknown): number | null {
  if (!value) return null;
  const parsed = new Date(String(value)).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}
