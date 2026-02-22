import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLayout } from "../context/LayoutContext";

export default function NotFoundPage() {
  const { setStatus } = useLayout();

  useEffect(() => {
    setStatus({
      title: "Not Found",
      detail: "This page does not exist",
      meta: "404",
    });
  }, [setStatus]);

  return (
    <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">
        Liege-Tracker
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">That page is missing.</h2>
      <p className="mt-2 text-sm text-bark">
        Double-check the address or head back to your dashboard.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:border-ember/60 hover:text-ember"
      >
        Back to dashboard
      </Link>
    </section>
  );
}
