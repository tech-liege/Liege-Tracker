export default function Section({ className = "", children }) {
  const classes = ["rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8", className]
    .filter(Boolean)
    .join(" ");

  return <section className={classes}>{children}</section>;
}
