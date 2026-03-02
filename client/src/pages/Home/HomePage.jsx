import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLayout } from "../../context/LayoutContext";
import { useSession } from "../../context/SessionContext";
import { isGuestSession } from "../../utils/guestSession";

const featureCards = [
  {
    title: "AI Roadmaps",
    description:
      "Describe your goal and generate milestone plans you can review before saving.",
  },
  {
    title: "Task Execution",
    description:
      "Manage priorities, due dates, tags, and statuses from one focused board.",
  },
  {
    title: "Guest Friendly",
    description:
      "Explore the app without creating an account. Local tasks remain on-device.",
  },
];

const workflowSteps = [
  {
    step: "1. Define Goal",
    detail: "Set a clear outcome and create a roadmap draft in seconds.",
  },
  {
    step: "2. Confirm Plan",
    detail: "Refine milestones and convert roadmap items into actionable todos.",
  },
  {
    step: "3. Ship Daily",
    detail: "Track progress, clear overdue work, and keep momentum.",
  },
];

export default function HomePage() {
  const { setStatus } = useLayout();
  const { session, checkingSession } = useSession();
  const guestMode = isGuestSession(session);

  useEffect(() => {
    if (checkingSession) {
      setStatus({
        title: "Home",
        detail: "Checking session",
        meta: "Hold tight",
      });
      return;
    }

    setStatus({
      title: "Home",
      detail: session ? "Session available" : "Public landing",
      meta: session ? (guestMode ? "Guest mode" : session.user.email) : "Guest",
    });
  }, [checkingSession, guestMode, session, setStatus]);

  if (checkingSession) {
    return (
      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-sm text-bark">Checking session...</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="ui-enter relative overflow-hidden rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-emberSoft/50 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-clay/80 blur-2xl" />

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">
          Liege-Tracker
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">
          Plan with intent.
          <br />
          Execute with focus.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-bark sm:text-base">
          A focused workspace for turning goals into roadmaps and roadmaps into
          completed tasks.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to={session ? "/dashboard" : "/auth"}
            className="rounded-2xl bg-ember px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(217,115,66,0.35)]"
          >
            {session ? "Open Dashboard" : "Get Started"}
          </Link>
          <Link
            to={session ? "/tasks" : "/auth"}
            className="rounded-2xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ember/60 hover:text-ember"
          >
            {session ? "View Tasks" : "Try Guest Mode"}
          </Link>
        </div>

        {guestMode ? (
          <p className="mt-4 text-xs text-bark">
            Guest mode is active. AI roadmap generation is unavailable.
          </p>
        ) : null}
      </section>

      <section className="ui-enter-delayed grid gap-4 md:grid-cols-3">
        {featureCards.map((feature) => (
          <article
            key={feature.title}
            className="rounded-3xl border border-border bg-white/80 p-5 shadow-soft backdrop-blur"
          >
            <h2 className="text-lg font-semibold text-ink">{feature.title}</h2>
            <p className="mt-2 text-sm text-bark">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-white/85 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">
          Workflow
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {workflowSteps.map((item) => (
            <article key={item.step} className="rounded-2xl bg-sand p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">
                {item.step}
              </h3>
              <p className="mt-2 text-sm text-bark">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
