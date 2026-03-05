import { Link } from "react-router-dom";
import { BoltIcon, CheckCircleIcon, ListIcon, RoadmapIcon, Section, SparkIcon, TasksIcon } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { isGuestSession } from "@/utils/guestSession";

const valuePillars = [
  {
    label: "AI Strategy",
    icon: SparkIcon,
    heading: "From rough idea to clear roadmap",
    copy: "Describe your target and get structured milestones with actionable task suggestions.",
  },
  {
    label: "Execution Board",
    icon: TasksIcon,
    heading: "Daily work stays visible and sortable",
    copy: "Track deadlines, priorities, statuses, and tags from one focused board built for shipping.",
  },
  {
    label: "Zero Friction",
    icon: BoltIcon,
    heading: "Use it immediately with guest mode",
    copy: "Evaluate the workflow before account creation. Guest tasks remain on your local device.",
  },
];

const launchFlow = [
  {
    step: "01",
    icon: RoadmapIcon,
    title: "Define the objective",
    detail: "Name your goal and generate an AI draft in seconds.",
  },
  {
    step: "02",
    icon: CheckCircleIcon,
    title: "Refine the milestones",
    detail: "Edit timing, scope, and task details before committing anything.",
  },
  {
    step: "03",
    icon: ListIcon,
    title: "Execute from one board",
    detail: "Move tasks through statuses and keep progress visible every day.",
  },
];

const signalItems = [
  {
    value: "Roadmaps + Tasks",
    icon: RoadmapIcon,
    label: "Single workflow",
  },
  {
    value: "Guest-first",
    icon: BoltIcon,
    label: "No signup required",
  },
  {
    value: "Clear priorities",
    icon: TasksIcon,
    label: "Less task drift",
  },
];

export default function HomePage() {
  const { session, checkingSession } = useSession();
  const guestMode = isGuestSession(session);

  if (checkingSession) {
    return (
      <Section>
        <p className="text-sm text-bark">Checking session...</p>
      </Section>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Section className="ui-enter relative overflow-hidden border-none bg-cyan-300 px-6 py-10 text-gray-100 shadow-[0_35px_80px_rgba(16,42,67,0.38)] sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-20 top-0 h-60 w-60 rounded-full bg-ember/45 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#1f6f8b]/40 blur-3xl" />

        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/90">Liege-Tracker</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight sm:text-6xl">
          Ship real progress,
          <br className="hidden sm:block" />
          not just scattered tasks.
        </h1>
        <p className="mt-5 max-w-2xl text-sm text-cyan-50/85 sm:text-base">
          Move from strategy to execution in one workspace. Draft roadmap milestones with AI, convert them into tasks, and track delivery with clear
          status flow.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={session ? "/dashboard" : "/auth"}
            className="rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-clay"
          >
            {session ? "Open Dashboard" : "Get Started"}
          </Link>
          <Link
            to={session ? "/tasks" : "/auth"}
            className="rounded-2xl border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/70 hover:bg-white/20"
          >
            {session ? "View Tasks" : "Try Guest Mode"}
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {signalItems.map((item) => (
            <article key={item.value} className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                <item.icon className="h-4 w-4" />
                {item.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-50/80">{item.label}</p>
            </article>
          ))}
        </div>

        {guestMode ? <p className="mt-4 text-xs text-cyan-50/80">Guest mode is active. AI roadmap generation is unavailable.</p> : null}
      </Section>

      <section className="ui-enter-delayed grid gap-4 md:grid-cols-3">
        {valuePillars.map((pillar) => (
          <article key={pillar.heading} className="rounded-3xl border border-border bg-white/80 p-6 shadow-soft backdrop-blur">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-bark">
              <pillar.icon className="h-4 w-4" />
              {pillar.label}
            </p>
            <h2 className="mt-3 text-xl font-semibold text-ink">{pillar.heading}</h2>
            <p className="mt-3 text-sm text-bark">{pillar.copy}</p>
          </article>
        ))}
      </section>

      <Section className="bg-white/90">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bark">Launch Flow</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {launchFlow.map((item) => (
            <article key={item.step} className="rounded-2xl bg-sand p-5">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-bark">
                <item.icon className="h-4 w-4" />
                {item.step}
              </p>
              <h3 className="mt-2 text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm text-bark">{item.detail}</p>
            </article>
          ))}
        </div>
      </Section>
    </div>
  );
}
