export default function compareText(a: unknown, b: unknown): number {
  return String(a || "").localeCompare(String(b || ""), undefined, {
    sensitivity: "base",
    numeric: true,
  });
}
