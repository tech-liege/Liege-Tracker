export default function parseTagInput(value) {
  if (!value) return [];
  const unique = new Set();
  for (const chunk of String(value).split(",")) {
    const normalized = chunk.trim().toLowerCase();
    if (!normalized) continue;
    unique.add(normalized);
    if (unique.size >= 8) break;
  }
  return [...unique];
}
