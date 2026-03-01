export default function parseTagInput(value: string): string[] {
  if (!value) return [];
  const unique = new Set<string>();
  for (const chunk of String(value).split(",")) {
    const normalized = chunk.trim().toLowerCase();
    if (!normalized) continue;
    unique.add(normalized);
    if (unique.size >= 8) break;
  }
  return [...unique];
}
