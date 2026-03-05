import { Link } from "react-router-dom";
import { DashboardIcon, Section } from "@/components/ui";
import { useSession } from "@/context/SessionContext";

export default function NotFoundPage() {
  const { session } = useSession();

  return (
    <Section>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">Liege-Tracker</p>
      <h2 className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-ink">
        <DashboardIcon className="h-5 w-5" />
        That page is missing.
      </h2>
      <p className="mt-2 text-sm text-bark">Double-check the address or head back to your dashboard.</p>
      <Link
        to={session ? "/dashboard" : "/home"}
        className="mt-5 inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:border-ember/60 hover:text-ember"
      >
        {session ? "Back to dashboard" : "Back to home"}
      </Link>
    </Section>
  );
}
