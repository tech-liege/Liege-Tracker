import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { requestAccountVerification } from "@/api";
import { Button, CloudIcon, MailIcon, Section, SettingsIcon, SparkIcon, UserIcon } from "@/components/ui";
import { useLayout } from "@/context/LayoutContext";
import { useSession } from "@/context/SessionContext";
import { isGuestSession } from "@/utils/guestSession";
import InfoCard from "./components/InfoCard";

export default function SettingsPage() {
  const { session, checkingSession, logout } = useSession();
  const { setStatus } = useLayout();
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [verifyMessage, setVerifyMessage] = useState(null);
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
      detail: isGuestUser ? "Guest profile" : isUnverified ? "Unverified account" : "Account profile",
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
      setVerifyError(err.message);
    } finally {
      setVerifyBusy(false);
    }
  }

  if (checkingSession) {
    return (
      <Section className="ui-enter">
        <p className="text-sm text-bark">Checking session...</p>
      </Section>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex flex-col gap-5">
      <Section className="ui-enter bg-white/95 sm:p-7">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-bark">
          <SettingsIcon className="h-4 w-4" />
          Settings
        </p>
        <h1 className="mt-2 text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.2rem]">Session & Account</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bark">Review mode and manage your current session.</p>
      </Section>

      <Section className="ui-enter-delayed bg-white/95 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard label="Email" value={session.user.email} icon={MailIcon} className="ui-stagger-base ui-stagger-1" />
          <InfoCard label="Mode" value={isGuestUser ? "Guest" : "Authenticated"} icon={UserIcon} className="ui-stagger-base ui-stagger-2" />
          <InfoCard
            label="Verification"
            value={isGuestUser ? "N/A (guest)" : isUnverified ? "Unverified" : "Verified"}
            icon={MailIcon}
            className="ui-stagger-base ui-stagger-3"
          />
          <InfoCard
            label="Data Storage"
            value={isGuestUser ? "Local device only" : "MongoDB cloud"}
            icon={CloudIcon}
            className="ui-stagger-base ui-stagger-4"
          />
          <InfoCard
            label="AI Roadmaps"
            value={isGuestUser || isUnverified ? "Unavailable" : "Enabled"}
            icon={SparkIcon}
            className="ui-stagger-base ui-stagger-5"
          />
        </div>

        {isUnverified ? (
          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">Account not verified</p>
            <p className="mt-1 text-sm text-amber-800">
              You can sign in, but tasks and roadmaps stay locked until you verify your account.
            </p>
            <Button type="button" onClick={handleResendVerification} disabled={verifyBusy} className="mt-4">
              {verifyBusy ? "Sending..." : "Resend verification email"}
            </Button>
            {verifyMessage ? <p className="mt-3 text-sm text-emerald-700">{verifyMessage}</p> : null}
            {verifyError ? <p className="mt-3 text-sm text-red-700">{verifyError}</p> : null}
          </div>
        ) : null}

        <Button type="button" onClick={logout} variant="secondary" className="mt-6">
          Sign out
        </Button>
      </Section>
    </div>
  );
}
