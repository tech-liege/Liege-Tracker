import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { createTodo, deleteTodo, fetchTodos, updateTodo } from "@/api";
import {
  BoltIcon,
  Button,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  Field,
  FilterIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  Section,
  SortIcon,
  TasksIcon,
} from "@/components/ui";
import { useLayout } from "@/context/LayoutContext";
import { useSession } from "@/context/SessionContext";
import { useUX } from "@/context/UXContext";
import { tasks } from "@/func";
import { createGuestTodo, isGuestSession, loadGuestTodos, saveGuestTodos } from "@/utils/guestSession";
import StatCard from "./components/StatCard";
import TodoItem from "./components/TodoItem";

const { normalize, formatDueDate, parseTagInput, compareText, toTimestamp } = tasks;

const statusFilters = ["all", "todo", "in_progress", "done"];
const sortByOptions = ["date", "text", "priority", "status"];
const priorityFilters = ["all", "high", "medium", "low"];
const priorityRanks = { low: 1, medium: 2, high: 3 };
const statusRanks = { todo: 1, in_progress: 2, done: 3 };

const inputClass =
  "w-full rounded-2xl border border-border bg-[#f2f8fd] px-4 py-2.5 text-sm text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30";
const selectClass =
  "w-full rounded-2xl border border-border bg-[#f2f8fd] px-4 py-2.5 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30";

function filterButtonClass(active) {
  return `rounded-xl border px-3 py-2 text-sm font-semibold transition ${
    active ? "border-ink bg-ink text-white" : "border-border bg-white text-bark hover:border-ink hover:text-ink"
  }`;
}

export default function TasksPage() {
  const { session, checkingSession } = useSession();
  const { setStatus } = useLayout();
  const { isOnline } = useUX();

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("1");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [newTodo, setNewTodo] = useState({
    text: "",
    dueDate: "",
    priority: "medium",
    tagsInput: "",
  });

  const isGuestUser = isGuestSession(session);

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

  useEffect(() => {
    if (!isGuestUser || loading) return;
    saveGuestTodos(todos);
  }, [isGuestUser, loading, todos]);

  const stats = useMemo(() => {
    const total = todos.length;
    const done = todos.filter((todo) => normalize.status(todo) === "done").length;
    const inProgress = todos.filter(
      (todo) => normalize.status(todo) === "in_progress",
    ).length;
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
    const direction = sortOrder === "-1" ? -1 : 1;

    return todos
      .filter((todo) => {
        const todoStatus = normalize.status(todo);
        if (statusFilter !== "all" && todoStatus !== statusFilter) return false;
        if (priorityFilter !== "all" && todo.priority !== priorityFilter) {
          return false;
        }
        if (!normalizedSearch) return true;

        const haystack = [todo.text, ...(todo.tags || [])].join(" ").toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (sortBy === "date") {
          const aTime = toTimestamp(a?.dueDate);
          const bTime = toTimestamp(b?.dueDate);
          const aHasDate = aTime !== null;
          const bHasDate = bTime !== null;

          if (aHasDate !== bHasDate) {
            return aHasDate ? -1 : 1;
          }

          if (aHasDate && bHasDate && aTime !== bTime) {
            return (aTime - bTime) * direction;
          }

          return compareText(a?.text, b?.text);
        }

        if (sortBy === "text") {
          const compared = compareText(a?.text, b?.text);
          if (compared !== 0) return compared * direction;
          return compareText(a?.dueDate, b?.dueDate);
        }

        if (sortBy === "priority") {
          const aPriority = priorityRanks[a?.priority] || 0;
          const bPriority = priorityRanks[b?.priority] || 0;
          if (aPriority !== bPriority) {
            return (aPriority - bPriority) * direction;
          }
          return compareText(a?.text, b?.text);
        }

        const aStatus = statusRanks[normalize.status(a)] || 0;
        const bStatus = statusRanks[normalize.status(b)] || 0;
        if (aStatus !== bStatus) return (aStatus - bStatus) * direction;
        return compareText(a?.text, b?.text);
      });
  }, [priorityFilter, search, sortBy, sortOrder, statusFilter, todos]);

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
  }, [
    checkingSession,
    session,
    setStatus,
    stats.done,
    stats.inProgress,
    stats.total,
  ]);

  async function handleAdd(event) {
    event.preventDefault();
    const text = newTodo.text.trim();
    if (!text) return;

    if (!isOnline && !isGuestUser) {
      setError(
        "You are offline. Creating and updating tasks is disabled until your connection is restored.",
      );
      return;
    }

    const payload = {
      text,
      dueDate: newTodo.dueDate || null,
      priority: newTodo.priority,
      tags: parseTagInput(newTodo.tagsInput),
      status: "todo",
    };

    try {
      const created = isGuestUser
        ? createGuestTodo(payload)
        : await createTodo(payload);

      setTodos((prev) => [created, ...prev]);
      setNewTodo({ text: "", dueDate: "", priority: "medium", tagsInput: "" });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(todo, nextStatus) {
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
      setError(err.message);
    }
  }

  async function handleDelete(todo) {
    if (isGuestUser) {
      setTodos((prev) => prev.filter((item) => item._id !== todo._id));
      return;
    }

    try {
      await deleteTodo(todo._id);
      setTodos((prev) => prev.filter((item) => item._id !== todo._id));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEdit(todo, updates) {
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
      setError(err.message);
      throw err;
    }
  }

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
          <TasksIcon className="h-4 w-4" />
          Tasks
        </p>
        <h1 className="mt-2 text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.2rem]">Task Command Center</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-bark">
          Organize execution with clean priorities, predictable statuses, and clear due dates.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total" value={stats.total} icon={ListIcon} className="ui-stagger-base ui-stagger-1" />
          <StatCard label="To Do" value={stats.todoCount} icon={ListIcon} className="ui-stagger-base ui-stagger-2" />
          <StatCard label="In Progress" value={stats.inProgress} icon={BoltIcon} className="ui-stagger-base ui-stagger-3" />
          <StatCard label="Done" value={stats.done} icon={CheckCircleIcon} className="ui-stagger-base ui-stagger-4" />
          <StatCard label="Overdue" value={stats.overdue} icon={ClockIcon} className="ui-stagger-base ui-stagger-5" />
        </div>
      </Section>

      <Section className="ui-enter-delayed bg-white/95 sm:p-7">
        {!isOnline && !isGuestUser ? (
          <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Offline mode: creating and updating tasks is disabled.
          </p>
        ) : null}

        <div className="space-y-5">
          <form onSubmit={handleAdd} className="space-y-2.5">
            <h2 className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-bark">
              <PlusIcon className="h-4 w-4" />
              Add Task
            </h2>
            <div className="grid gap-3 lg:grid-cols-[2fr_170px_160px_1fr_auto]">
              <Field
                type="text"
                value={newTodo.text}
                onChange={(event) => setNewTodo((prev) => ({ ...prev, text: event.target.value }))}
                placeholder="Define the next concrete task"
              />
              <Field
                type="date"
                value={newTodo.dueDate}
                onChange={(event) => setNewTodo((prev) => ({ ...prev, dueDate: event.target.value }))}
                className="text-sm"
              />
              <select
                value={newTodo.priority}
                onChange={(event) => setNewTodo((prev) => ({ ...prev, priority: event.target.value }))}
                className={selectClass}
              >
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
              <Field
                type="text"
                value={newTodo.tagsInput}
                onChange={(event) => setNewTodo((prev) => ({ ...prev, tagsInput: event.target.value }))}
                placeholder="tags, comma, separated"
                className="text-sm"
              />
              <Button type="submit" disabled={!isOnline && !isGuestUser} className="h-full min-h-[48px]">
                <PlusIcon className="h-4 w-4" />
                Add task
              </Button>
            </div>
          </form>

          <div className="rounded-2xl border border-border bg-[#eaf3fb] p-4 sm:p-5">
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              aria-expanded={filtersOpen}
              aria-controls="task-filter-panel"
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-2 py-1 text-left transition hover:border-border"
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-bark">
                <FilterIcon className="h-4 w-4" />
                Filters & Sorting
              </span>
              {filtersOpen ? <ChevronUpIcon className="h-4 w-4 text-bark" /> : <ChevronDownIcon className="h-4 w-4 text-bark" />}
            </button>

            {filtersOpen ? (
              <div id="task-filter-panel" className="mt-4 space-y-4 border-t border-border/70 pt-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.3fr]">
                  <fieldset className="space-y-2">
                    <legend className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-bark">
                      <ListIcon className="h-4 w-4" />
                      Status
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {statusFilters.map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={filterButtonClass(statusFilter === value)}
                          onClick={() => setStatusFilter(value)}
                        >
                          {value.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-2">
                    <legend className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-bark">
                      <BoltIcon className="h-4 w-4" />
                      Priority
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {priorityFilters.map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={filterButtonClass(priorityFilter === value)}
                          onClick={() => setPriorityFilter(value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-2">
                    <legend className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-bark">
                      <SearchIcon className="h-4 w-4" />
                      Search
                    </legend>
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search text or tags"
                      className={inputClass}
                    />
                  </fieldset>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-bark">
                    <span className="inline-flex items-center gap-2">
                      <SortIcon className="h-4 w-4" />
                      Sort By
                    </span>
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className={selectClass}>
                      {sortByOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-bark">
                    <span className="inline-flex items-center gap-2">
                      <SortIcon className="h-4 w-4" />
                      Sort Order
                    </span>
                    <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className={selectClass}>
                      <option value="1">Ascending</option>
                      <option value="-1">Descending</option>
                    </select>
                  </label>
                </div>
              </div>
            ) : null}
          </div>

          {loading ? (
            <p className="text-sm text-bark">Loading tasks...</p>
          ) : error ? (
            <p className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : filteredTodos.length === 0 ? (
            <p className="rounded-xl bg-[#e6f1fa] px-4 py-3 text-sm text-bark">No tasks match the selected filters.</p>
          ) : (
            <ul className="grid gap-3">
              {filteredTodos.map((todo, index) => (
                <TodoItem
                  key={todo?._id || `todo-${index}`}
                  todo={todo}
                  formatDueDate={formatDueDate}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  normalizeStatus={normalize.status}
                  actionsDisabled={!isOnline && !isGuestUser}
                  className={`ui-stagger-base ui-stagger-${(index % 6) + 1}`}
                />
              ))}
            </ul>
          )}
        </div>
      </Section>
    </div>
  );
}
