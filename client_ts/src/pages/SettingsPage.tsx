import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useLayout } from "../context/LayoutContext";
import { useSession } from "../context/SessionContext";
import { isGuestSession } from "../utils/guestSession";

export default function SettingsPage() {
  const { session, checkingSession, logout } = useSession();
  const { setStatus } = useLayout();
  const isGuestUser = isGuestSession(session);

  useEffect(() => {
    if (checkingSession) {
      setStatus({ title: "Settings", detail: "Checking session", meta: "Hold tight" });
      return;
    }

    if (!session) {
      setStatus({ title: "Settings", detail: "Sign in required", meta: "Guest" });
      return;
    }

    setStatus({
      title: "Settings",
      detail: isGuestUser ? "Guest profile" : "Account profile",
      meta: session.user.email,
    });
  }, [checkingSession, isGuestUser, session, setStatus]);

  if (checkingSession) {
    return (
      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-sm text-bark">Checking session...</p>
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="ui-enter rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">Session & Account</h1>
        <p className="mt-2 text-sm text-bark">Review mode and manage your current session.</p>
      </section>

      <section className="ui-enter-delayed rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard label="Email" value={session.user.email} />
          <InfoCard label="Mode" value={isGuestUser ? "Guest" : "Authenticated"} />
          <InfoCard label="Data Storage" value={isGuestUser ? "Local device only" : "MongoDB cloud"} />
          <InfoCard label="AI Roadmaps" value={isGuestUser ? "Unavailable" : "Enabled"} />
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-6 rounded-2xl border border-border px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ember/60 hover:text-ember"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-border bg-sand p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-bark">{label}</p>
      <p className="mt-1 text-base font-semibold text-ink">{value}</p>
    </article>
  );
}
