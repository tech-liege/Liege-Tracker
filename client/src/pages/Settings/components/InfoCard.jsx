export default function InfoCard({ label, value, icon: Icon, className = "" }) {
  const classes = ["rounded-2xl border border-border bg-white p-4", className]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bark">
          {label}
        </p>
        {Icon ? <Icon className="h-4 w-4 text-bark" /> : null}
      </div>
      <p className="mt-2 text-base font-semibold text-ink">{value}</p>
    </article>
  );
}
