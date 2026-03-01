type MetricCardProps = {
  label: string;
  value: string | number;
  detail: string;
};

export default function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-sand p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-bark">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-bark">{detail}</p>
    </article>
  );
}
