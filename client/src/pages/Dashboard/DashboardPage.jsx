import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchRoadmaps, fetchTodos } from "@/api";
import { BoltIcon, ClockIcon, DashboardIcon, MailIcon, RoadmapIcon, Section, SettingsIcon, TasksIcon } from "@/components/ui";
import { useLayout } from "@/context/LayoutContext";
import { useSession } from "@/context/SessionContext";
import { isGuestSession, loadGuestTodos } from "@/utils/guestSession";
import { tasks } from "@/func";
import MetricCard from "./components/MetricCard";
import ActionCard from "./components/ActionCard";

const { normalize } = tasks;

export default function DashboardPage() {
  const { session, checkingSession } = useSession();
  const { setStatus } = useLayout();

  const [todos, setTodos] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isGuestUser = isGuestSession(session);

  useEffect(() => {
    let active = true;

    if (!session) {
      setTodos([]);
      setRoadmaps([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);

    if (isGuestUser) {
      const guestTodos = loadGuestTodos();
      setTodos(guestTodos);
      setRoadmaps([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    Promise.all([fetchTodos(), fetchRoadmaps()])
      .then(([todoItems, roadmapItems]) => {
        if (!active) return;
        setTodos(Array.isArray(todoItems) ? todoItems : []);
        setRoadmaps(Array.isArray(roadmapItems) ? roadmapItems : []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isGuestUser, session?.token]);

  const stats = useMemo(() => {
    const done = todos.filter(
      (todo) => normalize.status(todo) === "done",
    ).length;
    const inProgress = todos.filter(
      (todo) => normalize.status(todo) === "in_progress",
    ).length;
    const todoCount = todos.length - done - inProgress;
    const overdue = todos.filter((todo) => {
      if (!todo?.dueDate || normalize.status(todo) === "done") return false;
      const due = new Date(todo.dueDate);
      return !Number.isNaN(due.getTime()) && due < new Date();
    }).length;
    return {
      totalTasks: todos.length,
      done,
      inProgress,
      todoCount,
      overdue,
      roadmaps: roadmaps.length,
    };
  }, [roadmaps.length, todos]);

  useEffect(() => {
    if (checkingSession) {
      setStatus({
        title: "Dashboard",
        detail: "Checking session",
        meta: "Hold tight",
      });
      return;
    }

    if (!session) {
      setStatus({
        title: "Dashboard",
        detail: "Sign in required",
        meta: "Guest",
      });
      return;
    }

    setStatus({
      title: "Dashboard",
      detail: `${stats.done} done • ${stats.totalTasks} total tasks`,
      meta: isGuestUser ? "Guest mode" : `${stats.roadmaps} roadmaps`,
    });
  }, [
    checkingSession,
    isGuestUser,
    session,
    setStatus,
    stats.done,
    stats.roadmaps,
    stats.totalTasks,
  ]);

  if (checkingSession) {
    return (
      <Section>
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
          <DashboardIcon className="h-4 w-4" />
          Dashboard
        </p>
        <h1 className="mt-2 text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.2rem]">Execution at a glance.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-bark">
          {isGuestUser
            ? "Guest mode is active. Tasks stay on this device and roadmap AI is unavailable."
            : "Track delivery progress and jump directly into roadmaps, tasks, and settings."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <MetricCard
            label="Tasks"
            value={stats.totalTasks}
            detail={`${stats.todoCount} to do`}
            icon={TasksIcon}
            className="ui-stagger-base ui-stagger-1"
          />
          <MetricCard
            label="In Progress"
            value={stats.inProgress}
            detail={`${stats.done} completed`}
            icon={BoltIcon}
            className="ui-stagger-base ui-stagger-2"
          />
          <MetricCard label="Overdue" value={stats.overdue} detail="Needs attention" icon={ClockIcon} className="ui-stagger-base ui-stagger-3" />
          <MetricCard label="Roadmaps" value={stats.roadmaps} detail="Saved strategy" icon={RoadmapIcon} className="ui-stagger-base ui-stagger-4" />
          <MetricCard
            label="Session"
            value={isGuestUser ? "Guest" : "User"}
            detail={session.user.email}
            icon={MailIcon}
            className="ui-stagger-base ui-stagger-5"
          />
          <MetricCard
            label="Focus"
            value={error ? "Blocked" : loading ? "Syncing" : "Ready"}
            detail="System status"
            icon={BoltIcon}
            className="ui-stagger-base ui-stagger-6"
          />
        </div>
      </Section>

      <section className="ui-enter-delayed grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          title="Roadmaps"
          description="Generate, review, and confirm AI roadmaps before creating todos."
          cta="Open Roadmaps"
          to="/roadmaps"
          disabled={isGuestUser}
          helper={isGuestUser ? "Disabled in guest mode" : null}
          icon={RoadmapIcon}
          className="ui-stagger-base ui-stagger-2"
        />
        <ActionCard
          title="Tasks"
          description="Manage work with statuses, priorities, deadlines, and tags."
          cta="Open Tasks"
          to="/tasks"
          icon={TasksIcon}
          className="ui-stagger-base ui-stagger-3"
        />
        <ActionCard
          title="Settings"
          description="Manage session and review account mode details."
          cta="Open Settings"
          to="/settings"
          icon={SettingsIcon}
          className="ui-stagger-base ui-stagger-4"
        />
      </section>

      {error ? <section className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section> : null}
    </div>
  );
}
