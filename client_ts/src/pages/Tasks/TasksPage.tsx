import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { createTodo, deleteTodo, fetchTodos, updateTodo } from "@/api";
import TodoItem from "@/components/TodoItem";
import { useLayout } from "@/context/LayoutContext";
import { useSession } from "@/context/SessionContext";
import { createGuestTodo, isGuestSession, loadGuestTodos, saveGuestTodos } from "@/utils/guestSession";
import type { Todo, TodoPriority, TodoStatus } from "@/types";
import { tasks } from "@/func";

const { normalize, formatDueDate, parseTagInput } = tasks;

const statusFilters: Array<"all" | TodoStatus> = ["all", "todo", "in_progress", "done"];
const priorityFilters: Array<"all" | TodoPriority> = ["all", "high", "medium", "low"];
const sortByOptions = ["date", "text", "priority", "status"];
const priorityRanks = { low: 1, medium: 2, high: 3 };
const statusRanks = { todo: 1, in_progress: 2, done: 3 };

export default function TasksPage() {
  const { session, checkingSession } = useSession();
  const { setStatus } = useLayout();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("all");
  const [priorityFilter, setPriorityFilter] = useState<(typeof priorityFilters)[number]>("all");
  const [search, setSearch] = useState("");
  const [newTodo, setNewTodo] = useState({
    text: "",
    dueDate: "",
    priority: "medium" as TodoPriority,
    tagsInput: "",
  });

  const isGuestUser = isGuestSession(session);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleOnlineStatus = () => {
      setIsOnline(window.navigator.onLine);
    };

    handleOnlineStatus();
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);
    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!session) {
      setTodos([]);
      setError(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);

    if (isGuestUser) {
      setTodos(loadGuestTodos());
      setError(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    fetchTodos()
      .then((data) => {
        if (!active) return;
        setTodos(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError((err as Error).message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isGuestUser, session?.token]);

  useEffect(() => {
    if (!isGuestUser || loading) return;
    saveGuestTodos(todos);
  }, [isGuestUser, loading, todos]);

  const stats = useMemo(() => {
    const total = todos.length;
    const done = todos.filter((todo) => normalize.status(todo) === "done").length;
    const inProgress = todos.filter((todo) => normalize.status(todo) === "in_progress").length;
    const todoCount = total - done - inProgress;
    const overdue = todos.filter((todo) => {
      if (!todo?.dueDate || normalize.status(todo) === "done") return false;
      const due = new Date(todo.dueDate);
      return !Number.isNaN(due.getTime()) && due < new Date();
    }).length;
    return { total, done, inProgress, todoCount, overdue };
  }, [todos]);

  const filteredTodos = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return todos.filter((todo) => {
      const todoStatus = normalize.status(todo);
      if (statusFilter !== "all" && todoStatus !== statusFilter) return false;
      if (priorityFilter !== "all" && todo.priority !== priorityFilter) return false;
      if (!normalizedSearch) return true;

      const haystack = [todo.text, ...(todo.tags || [])].join(" ").toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [priorityFilter, search, statusFilter, todos]);

  useEffect(() => {
    if (checkingSession) {
      setStatus({
        title: "Tasks",
        detail: "Checking session",
        meta: "Hold tight",
      });
      return;
    }

    if (!session) {
      setStatus({
        title: "Tasks",
        detail: "Sign in required",
        meta: "Guest",
      });
      return;
    }

    setStatus({
      title: "Tasks",
      detail: `${stats.done} done • ${stats.inProgress} in progress`,
      meta: `${stats.total} total`,
    });
  }, [checkingSession, session, setStatus, stats.done, stats.inProgress, stats.total]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = newTodo.text.trim();
    if (!text) return;
    if (!isOnline && !isGuestUser) {
      setError("You are offline. Creating and updating tasks is disabled until your connection is restored.");
      return;
    }

    const payload = {
      text,
      dueDate: newTodo.dueDate || null,
      priority: newTodo.priority,
      tags: parseTagInput(newTodo.tagsInput),
      status: "todo" as TodoStatus,
    };

    try {
      const created = isGuestUser ? createGuestTodo(payload) : await createTodo(payload);
      setTodos((prev) => [created, ...prev]);
      setNewTodo({ text: "", dueDate: "", priority: "medium", tagsInput: "" });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleStatusChange(todo: Todo, nextStatus: TodoStatus) {
    if (!nextStatus || nextStatus === normalize.status(todo)) return;
    if (!isOnline && !isGuestUser) {
      setError("You are offline. Creating and updating tasks is disabled until your connection is restored.");
      return;
    }

    if (isGuestUser) {
      setTodos((prev) =>
        prev.map((item) =>
          item._id === todo._id
            ? {
                ...item,
                status: nextStatus,
                completed: nextStatus === "done",
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      return;
    }

    try {
      const updated = await updateTodo(todo._id, { status: nextStatus });
      setTodos((prev) => prev.map((item) => (item._id === todo._id ? updated : item)));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleEdit(
    todo: Todo,
    updates: {
      text: string;
      dueDate: string | null;
      priority: TodoPriority;
      tags: string[];
    },
  ) {
    if (!isOnline && !isGuestUser) {
      const message = "You are offline. Creating and updating tasks is disabled until your connection is restored.";
      setError(message);
      throw new Error(message);
    }

    if (isGuestUser) {
      setTodos((prev) =>
        prev.map((item) =>
          item._id === todo._id
            ? {
                ...item,
                ...updates,
                completed: item.completed,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      setError(null);
      return;
    }

    try {
      const updated = await updateTodo(todo._id, updates);
      setTodos((prev) => prev.map((item) => (item._id === todo._id ? updated : item)));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      throw err;
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
      setError(null);
    } catch (err) {
      setError((err as Error).message);
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
      <header className="ui-enter rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">Execution</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">Task Command Center</h1>
        <p className="mt-2 text-sm text-bark">Move work through clear states. Keep deadlines, tags, and priorities visible.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="To Do" value={stats.todoCount} />
          <StatCard label="In Progress" value={stats.inProgress} />
          <StatCard label="Done" value={stats.done} />
          <StatCard label="Overdue" value={stats.overdue} />
        </div>
      </header>

      <section className="ui-enter-delayed rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        {!isOnline && !isGuestUser ? (
          <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Offline mode: creating and updating tasks is disabled.
          </p>
        ) : null}

        <form onSubmit={handleAdd} className="">
          <fieldset className="grid gap-3 lg:grid-cols-[2fr_115px_130px_1fr_auto] border border-ember rounded-xl p-3 lg:p-5">
            <legend className="font-semibold text-xl"> Add New Task</legend>
            <input
              type="text"
              value={newTodo.text}
              onChange={(event) => setNewTodo((prev) => ({ ...prev, text: event.target.value }))}
              placeholder="Define the next concrete task"
              className="w-full rounded-2xl border border-border bg-sand px-4 py-3 text-base text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
            />
            <input
              type="date"
              value={newTodo.dueDate}
              onChange={(event) => setNewTodo((prev) => ({ ...prev, dueDate: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-sand px-4 py-3 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
            />
            <select
              value={newTodo.priority}
              onChange={(event) =>
                setNewTodo((prev) => ({
                  ...prev,
                  priority: event.target.value as TodoPriority,
                }))
              }
              className="w-full rounded-2xl border border-border bg-sand px-4 py-3 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
            >
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <input
              type="text"
              value={newTodo.tagsInput}
              onChange={(event) =>
                setNewTodo((prev) => ({
                  ...prev,
                  tagsInput: event.target.value,
                }))
              }
              placeholder="tags, comma, separated"
              className="w-full rounded-2xl border border-border bg-sand px-4 py-3 text-sm text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
            />
            <button
              type="submit"
              disabled={!isOnline && !isGuestUser}
              className="rounded-2xl bg-ember px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(217,115,66,0.35)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              Add task
            </button>
          </fieldset>
        </form>

        <fieldset className="mt-6 grid gap-3 lg:grid-cols-[auto_auto_1fr] bg-gray-100 p-3 pt-5 lg:p-5 lg:pt-7 rounded-xl">
          <legend className="relative top-4 font-semibold text-lg">Filter</legend>
          <fieldset className="flex flex-wrap gap-2 border border-ember rounded-xl p-2 lg:p-3">
            <legend className=" font-semibold">status</legend>
            {statusFilters.map((value) => (
              <button
                key={value}
                type="button"
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  statusFilter === value ? "border-transparent bg-emberSoft text-ink" : "border-border text-bark hover:border-ember/50 hover:text-ink"
                }`}
                onClick={() => setStatusFilter(value)}
              >
                {value.replace("_", " ")}
              </button>
            ))}
          </fieldset>

          <fieldset className="flex flex-wrap gap-2 font-semibold border border-ember rounded-xl p-2 lg:p-3">
            <legend className=" font-semibold">priority</legend>
            {priorityFilters.map((value) => (
              <button
                key={value}
                type="button"
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  priorityFilter === value
                    ? "border-transparent bg-emberSoft text-ink"
                    : "border-border text-bark hover:border-ember/50 hover:text-ink"
                }`}
                onClick={() => setPriorityFilter(value)}
              >
                {value}
              </button>
            ))}
          </fieldset>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search text or tags"
            className="w-full h-2/3 my-auto rounded-2xl border border-border bg-sand px-4 py-3 text-sm text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
          />
        </fieldset>

        {loading ? (
          <p className="mt-6 text-sm text-bark">Loading tasks...</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-700">{error}</p>
        ) : filteredTodos.length === 0 ? (
          <p className="mt-6 text-sm text-bark">No tasks match the selected filters.</p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {filteredTodos.map((todo, index) => (
              <TodoItem
                key={todo?._id || `todo-${index}`}
                todo={todo}
                formatDueDate={formatDueDate}
                onStatusChange={handleStatusChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                actionsDisabled={!isOnline && !isGuestUser}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-sand p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-bark">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
