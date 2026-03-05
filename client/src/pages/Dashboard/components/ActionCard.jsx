import { Link } from "react-router-dom";

export default function ActionCard({
  title,
  description,
  cta,
  to,
  disabled,
  helper,
  icon: Icon,
  className = "",
}) {
  const classes = ["rounded-2xl border border-border bg-white p-5", className]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes}>
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className="rounded-lg bg-clay p-2 text-ink">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <h2 className="text-base font-semibold text-ink sm:text-lg">{title}</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-bark">{description}</p>
      {disabled ? (
        <p className="mt-4 rounded-xl bg-[#e3eef8] px-3 py-2 text-sm text-bark">
          {helper || "Unavailable"}
        </p>
      ) : (
        <Link
          to={to}
          className="mt-4 inline-flex rounded-xl border border-border bg-[#f2f8fd] px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-white"
        >
          {cta}
        </Link>
      )}
    </article>
  );
}
