import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import {
  createTodo,
  deleteTodo,
  fetchTodos,
  generateRoadmapFromGoal,
  toggleTodo,
} from "../api";
import AiRoadmapPanel from "../components/AiRoadmapPanel";
import TodoItem from "../components/TodoItem";
import { useLayout } from "../context/LayoutContext";
import { useSession } from "../context/SessionContext";
import {
  createGuestTodo,
  isGuestSession,
  loadGuestTodos,
  saveGuestTodos,
} from "../utils/guestSession";
import type { Roadmap, Todo } from "../types";

const filters = ["all", "active", "completed"] as const;

const priorityStyles: Record<"low" | "medium" | "high", string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

function formatDueDate(value?: string | null) {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TodosPage() {
  const { session, checkingSession } = useSession();
  const { setStatus } = useLayout();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [goal, setGoal] = useState("");
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [latestRoadmap, setLatestRoadmap] = useState<Roadmap | null>(null);

  const isGuestUser = isGuestSession(session);

  useEffect(() => {
    let alive = true;

    if (!session) {
      setTodos([]);
      setLoading(false);
      setError(null);
      return () => {
        alive = false;
      };
    }

    setLoading(true);

    if (isGuestUser) {
      setTodos(loadGuestTodos());
      setError(null);
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    fetchTodos()
      .then((data) => {
        if (!alive) return;
        setTodos(data);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setError((err as Error).message);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [isGuestUser, session?.token]);

  useEffect(() => {
    if (!isGuestUser || loading) return;
    saveGuestTodos(todos);
  }, [isGuestUser, loading, todos]);

  useEffect(() => {
    if (!isGuestUser) return;
    setGoal("");
    setRoadmapError(null);
    setLatestRoadmap(null);
  }, [isGuestUser]);

  const completedCount = todos.filter((todo) => todo.completed).length;

  const filteredTodos = useMemo(() => {
    if (filter === "active") return todos.filter((todo) => !todo.completed);
    if (filter === "completed") return todos.filter((todo) => todo.completed);
    return todos;
  }, [filter, todos]);

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
      title: "Todo Board",
      detail: `${completedCount} done / ${todos.length} total`,
      meta: `Filter: ${filter}`,
    });
  }, [checkingSession, completedCount, filter, session, setStatus, todos.length]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = newText.trim();
    if (!text) return;

    try {
      const created = isGuestUser ? createGuestTodo(text) : await createTodo(text);
      setTodos((prev) => [created, ...prev]);
      setError(null);
      setNewText("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleToggle(todo: Todo) {
    if (isGuestUser) {
      setTodos((prev) =>
        prev.map((item) =>
          item._id === todo._id
            ? {
                ...item,
                completed: !item.completed,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      return;
    }

    try {
      const updated = await toggleTodo(todo._id, !todo.completed);
      setTodos((prev) => prev.map((item) => (item._id === todo._id ? updated : item)));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(todo: Todo) {
    if (isGuestUser) {
      setTodos((prev) => prev.filter((item) => item._id !== todo._id));
      return;
    }

    try {
      await deleteTodo(todo._id);
      setTodos((prev) => prev.filter((item) => item._id !== todo._id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleGenerateRoadmap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isGuestUser) {
      setRoadmapError("AI roadmap generation is unavailable in guest mode.");
      return;
    }

    const normalizedGoal = goal.trim();
    if (normalizedGoal.length < 5) {
      setRoadmapError("Goal must be at least 5 characters.");
      return;
    }

    setIsGeneratingRoadmap(true);

    try {
      const data = await generateRoadmapFromGoal(normalizedGoal);
      setLatestRoadmap(data.roadmap);
      setRoadmapError(null);
      setGoal("");
      setTodos((prev) => {
        const knownIds = new Set(prev.map((todo) => todo._id));
        const createdTodos = Array.isArray(data.todos)
          ? data.todos.filter((todo) => !knownIds.has(todo._id))
          : [];
        return [...createdTodos, ...prev];
      });
    } catch (err) {
      setRoadmapError((err as Error).message);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  }

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
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">
            Liege-Tracker
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-5xl">
            Track what matters today.
          </h1>
          <p className="mt-2 text-base text-bark">
            Simple, fast todo tracking backed by MongoDB.
          </p>
        </div>

        <div className="grid w-full max-w-xs grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-white/90 p-4 shadow-soft">
            <span className="text-sm text-bark">Total</span>
            <strong className="mt-1 block text-2xl text-ink">{todos.length}</strong>
          </div>
          <div className="rounded-2xl border border-border bg-white/90 p-4 shadow-soft">
            <span className="text-sm text-bark">Done</span>
            <strong className="mt-1 block text-2xl text-ink">{completedCount}</strong>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        {isGuestUser ? (
          <div className="rounded-2xl border border-border/70 bg-sand/70 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bark">
              Guest Mode
            </p>
            <h2 className="mt-2 text-xl font-semibold text-ink sm:text-2xl">
              AI roadmap is disabled for guests.
            </h2>
            <p className="mt-2 text-sm text-bark">
              Guest todos are stored only on this device.
            </p>
          </div>
        ) : (
          <AiRoadmapPanel
            goal={goal}
            setGoal={setGoal}
            handleGenerateRoadmap={handleGenerateRoadmap}
            isGeneratingRoadmap={isGeneratingRoadmap}
            roadmapError={roadmapError}
            latestRoadmap={latestRoadmap}
          />
        )}

        <form onSubmit={handleAdd} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            placeholder="Add a new task"
            value={newText}
            onChange={(event) => setNewText(event.target.value)}
            className="w-full rounded-2xl border border-border bg-sand px-4 py-3 text-base text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
          />
          <button
            type="submit"
            className="rounded-2xl bg-ember px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(217,115,66,0.35)]"
          >
            Add
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map((value) => (
            <button
              key={value}
              type="button"
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                filter === value
                  ? "border-transparent bg-emberSoft text-ink"
                  : "border-border text-bark hover:border-ember/50 hover:text-ink"
              }`}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-bark">Loading todos...</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-700">{error}</p>
        ) : filteredTodos.length === 0 ? (
          <p className="mt-6 text-sm text-bark">No tasks for this filter.</p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {filteredTodos.map((todo, index) => (
              <TodoItem
                key={todo._id || `todo-${index}`}
                todo={todo}
                formatDueDate={formatDueDate}
                priorityStyles={priorityStyles}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
