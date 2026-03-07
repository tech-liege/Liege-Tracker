import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { requestAccountVerification } from "@/api";
import { useLayout } from "@/context/LayoutContext";
import { useSession } from "@/context/SessionContext";
import { isGuestSession } from "@/utils/guestSession";
import InfoCard from "./components/InfoCard";

export default function SettingsPage() {
  const { session, checkingSession, logout } = useSession();
  const { setStatus } = useLayout();
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const isGuestUser = isGuestSession(session);
  const isUnverified = Boolean(session && !isGuestUser && session.user?.isVerified === false);

  useEffect(() => {
    if (checkingSession) {
      setStatus({
        title: "Settings",
        detail: "Checking session",
        meta: "Hold tight",
      });
      return;
    }

    if (!session) {
      setStatus({
        title: "Settings",
        detail: "Sign in required",
        meta: "Guest",
      });
      return;
    }

    setStatus({
      title: "Settings",
      detail: isGuestUser
        ? "Guest profile"
        : isUnverified
          ? "Unverified account"
          : "Account profile",
      meta: session.user.email,
    });
  }, [checkingSession, isGuestUser, isUnverified, session, setStatus]);

  async function handleResendVerification() {
    if (!session?.user?.email || isGuestUser) return;

    setVerifyBusy(true);
    setVerifyError(null);
    setVerifyMessage(null);
    try {
      const response = await requestAccountVerification(session.user.email);
      setVerifyMessage(
        response?.message || "If an account exists and is unverified, a verification email has been sent.",
      );
    } catch (err) {
      setVerifyError((err as Error).message);
    } finally {
      setVerifyBusy(false);
    }
  }

  if (checkingSession) {
    return (
      <section className="ui-enter rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-sm text-bark">Checking session...</p>
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="ui-enter-delayed rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
          Session & Account
        </h1>
        <p className="mt-2 text-sm text-bark">
          Review mode and manage your current session.
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard label="Email" value={session.user.email} />
          <InfoCard
            label="Mode"
            value={isGuestUser ? "Guest" : "Authenticated"}
          />
          <InfoCard
            label="Verification"
            value={
              isGuestUser
                ? "N/A (guest)"
                : isUnverified
                  ? "Unverified"
                  : "Verified"
            }
          />
          <InfoCard
            label="Data Storage"
            value={isGuestUser ? "Local device only" : "MongoDB cloud"}
          />
          <InfoCard
            label="AI Roadmaps"
            value={isGuestUser || isUnverified ? "Unavailable" : "Enabled"}
          />
        </div>

        {isUnverified ? (
          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">
              Account not verified
            </p>
            <p className="mt-1 text-sm text-amber-800">
              You can sign in, but tasks and roadmaps stay locked until you
              verify your account.
            </p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={verifyBusy}
              className="mt-4 rounded-2xl border border-border px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ember/60 hover:text-ember disabled:cursor-not-allowed disabled:opacity-70"
            >
              {verifyBusy ? "Sending..." : "Resend verification email"}
            </button>
            {verifyMessage ? (
              <p className="mt-3 text-sm text-emerald-700">{verifyMessage}</p>
            ) : null}
            {verifyError ? (
              <p className="mt-3 text-sm text-red-700">{verifyError}</p>
            ) : null}
          </div>
        ) : null}

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
