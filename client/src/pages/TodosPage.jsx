import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { createTodo, deleteTodo, fetchTodos, toggleTodo } from "../api";
import { useLayout } from "../context/LayoutContext";
import { useSession } from "../context/SessionContext";

const filters = ["all", "active", "completed"];

export default function TodosPage() {
  const { session, checkingSession } = useSession();
  const { setStatus } = useLayout();
  const [todos, setTodos] = useState([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

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
    fetchTodos()
      .then((data) => {
        if (!alive) return;
        setTodos(data);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [session?.token]);

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

  async function handleAdd(event) {
    event.preventDefault();
    const text = newText.trim();
    if (!text) return;
    setNewText("");
    try {
      const created = await createTodo(text);
      setTodos((prev) => [created, ...prev]);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(todo) {
    try {
      const updated = await toggleTodo(todo._id, !todo.completed);
      setTodos((prev) =>
        prev.map((item) => (item._id === todo._id ? updated : item)),
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(todo) {
    try {
      await deleteTodo(todo._id);
      setTodos((prev) => prev.filter((item) => item._id !== todo._id));
    } catch (err) {
      setError(err.message);
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
            <strong className="mt-1 block text-2xl text-ink">
              {todos.length}
            </strong>
          </div>
          <div className="rounded-2xl border border-border bg-white/90 p-4 shadow-soft">
            <span className="text-sm text-bark">Done</span>
            <strong className="mt-1 block text-2xl text-ink">
              {completedCount}
            </strong>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1fr_auto]">
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
            {filteredTodos.map((todo) => (
              <li
                key={todo._id}
                className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-border bg-sand px-4 py-3 transition ${
                  todo.completed ? "opacity-80" : ""
                }`}
              >
                <button
                  type="button"
                  aria-pressed={todo.completed}
                  onClick={() => handleToggle(todo)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                    todo.completed
                      ? "border-ember bg-ember text-white"
                      : "border-ember bg-white text-transparent hover:shadow-[0_8px_16px_rgba(217,115,66,0.25)]"
                  }`}
                >
                  ✓
                </button>
                <span
                  className={
                    todo.completed ? "text-bark line-through" : "text-ink"
                  }
                >
                  {todo.text}
                </span>
                <button
                  type="button"
                  className="text-sm text-bark transition hover:text-ink"
                  onClick={() => handleDelete(todo)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
