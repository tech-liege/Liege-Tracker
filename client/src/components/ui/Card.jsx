export default function Card({ className = "", children }) {
  const classes = ["rounded-2xl border border-border bg-white p-4", className]
    .filter(Boolean)
    .join(" ");

  return <article className={classes}>{children}</article>;
}
