import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { fetchRoadmaps, fetchTodos } from "../../api";
import { useLayout } from "../../context/LayoutContext";
import { useSession } from "../../context/SessionContext";
import { isGuestSession, loadGuestTodos } from "../../utils/guestSession";
import functions from "../../func";
import MetricCard from "./components/MetricCard";
import ActionCard from "./components/ActionCard";

const { tasks } = functions;
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
      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-sm text-bark">Checking session...</p>
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="ui-enter rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">
          Liege-Tracker
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
          Build momentum every day.
        </h1>
        <p className="mt-2 text-sm text-bark">
          {isGuestUser
            ? "You are in guest mode. Todos stay on this device and AI roadmap generation is disabled."
            : "Use AI roadmaps to generate structured plans, then execute in the Tasks board."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Tasks"
            value={stats.totalTasks}
            detail={`${stats.todoCount} to do`}
          />
          <MetricCard
            label="In Progress"
            value={stats.inProgress}
            detail={`${stats.done} completed`}
          />
          <MetricCard
            label="Overdue"
            value={stats.overdue}
            detail="Needs attention"
          />
          <MetricCard
            label="Roadmaps"
            value={stats.roadmaps}
            detail="Saved strategy"
          />
          <MetricCard
            label="Session"
            value={isGuestUser ? "Guest" : "User"}
            detail={session.user.email}
          />
          <MetricCard
            label="Focus"
            value={error ? "Blocked" : loading ? "Syncing" : "Ready"}
            detail="System status"
          />
        </div>
      </header>

      <section className="ui-enter-delayed grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          title="Roadmaps"
          description="Generate, review, and confirm AI roadmaps before creating todos."
          cta="Open Roadmaps"
          to="/roadmaps"
          disabled={isGuestUser}
          helper={isGuestUser ? "Disabled in guest mode" : null}
        />
        <ActionCard
          title="Tasks"
          description="Manage work with statuses, priorities, deadlines, and tags."
          cta="Open Tasks"
          to="/tasks"
        />
        <ActionCard
          title="Settings"
          description="Manage session and review account mode details."
          cta="Open Settings"
          to="/settings"
        />
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </section>
      ) : null}
    </div>
  );
}
