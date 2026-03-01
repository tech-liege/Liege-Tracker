export default function compareText(a, b) {
  return String(a || "").localeCompare(String(b || ""), undefined, {
    sensitivity: "base",
    numeric: true,
  });
}
