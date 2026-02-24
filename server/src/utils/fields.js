const priorityValues = new Set(["low", "medium", "high"]);
const statusValues = new Set(["todo", "in_progress", "done"]);

export function toNonEmptyString(value, maxLength = 140) {
  const normalized = String(value || "").trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  return normalized.slice(0, maxLength);
}

export function normalizePriority(value) {
  const normalized = toNonEmptyString(value, 20).toLowerCase();
  return priorityValues.has(normalized) ? normalized : "medium";
}

export function normalizeStatus(value) {
  const normalized = toNonEmptyString(value, 20).toLowerCase();
  return statusValues.has(normalized) ? normalized : "todo";
}

export function normalizeTags(value, maxTags = 6) {
  if (!Array.isArray(value)) return [];
  const unique = new Set();
  for (const tag of value) {
    const normalized = toNonEmptyString(tag, 24).toLowerCase();
    if (!normalized) continue;
    unique.add(normalized);
    if (unique.size >= maxTags) break;
  }
  return [...unique];
}

export function parseDateOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function parseNullableDate(value) {
  if (value === null) return null;
  if (typeof value === "undefined") return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}
