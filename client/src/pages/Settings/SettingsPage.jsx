import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button, CloudIcon, MailIcon, Section, SettingsIcon, SparkIcon, UserIcon } from "@/components/ui";
import { useLayout } from "@/context/LayoutContext";
import { useSession } from "@/context/SessionContext";
import { isGuestSession } from "@/utils/guestSession";
import InfoCard from "./components/InfoCard";

export default function SettingsPage() {
  const { session, checkingSession, logout } = useSession();
  const { setStatus } = useLayout();
  const isGuestUser = isGuestSession(session);

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
      detail: isGuestUser ? "Guest profile" : "Account profile",
      meta: session.user.email,
    });
  }, [checkingSession, isGuestUser, session, setStatus]);

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
            label="Data Storage"
            value={isGuestUser ? "Local device only" : "MongoDB cloud"}
            icon={CloudIcon}
            className="ui-stagger-base ui-stagger-3"
          />
          <InfoCard label="AI Roadmaps" value={isGuestUser ? "Unavailable" : "Enabled"} icon={SparkIcon} className="ui-stagger-base ui-stagger-4" />
        </div>

        <Button type="button" onClick={logout} variant="secondary" className="mt-6">
          Sign out
        </Button>
      </Section>
    </div>
  );
}
