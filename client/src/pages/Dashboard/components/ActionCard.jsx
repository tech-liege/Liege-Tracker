import { Link } from "react-router-dom";

export default function ActionCard({
  title,
  description,
  cta,
  to,
  disabled,
  helper,
}) {
  return (
    <article className="rounded-2xl border border-border bg-white/90 p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-bark">{description}</p>
      {disabled ? (
        <p className="mt-4 text-sm text-bark">{helper || "Unavailable"}</p>
      ) : (
        <Link
          to={to}
          className="mt-4 inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:border-ember/60 hover:text-ember"
        >
          {cta}
        </Link>
      )}
    </article>
  );
}
