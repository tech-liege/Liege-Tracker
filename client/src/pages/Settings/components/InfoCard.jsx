export default function InfoCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-border bg-sand p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-bark">{label}</p>
      <p className="mt-1 text-base font-semibold text-ink">{value}</p>
    </article>
  );
}
