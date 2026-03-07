import { useState } from "react";
import parseTagInput from "@/func/tasks/parseTagInput";
import type { Todo, TodoPriority, TodoStatus } from "../types";

const priorityStyles = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

const statusStyles: Record<TodoStatus, string> = {
  todo: "border-slate-300 bg-slate-50 text-slate-700",
  in_progress: "border-blue-300 bg-blue-50 text-blue-700",
  done: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

const statusOptions: Array<{ value: TodoStatus; label: string }> = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

function defaultNormalizeStatus(todo: Todo): TodoStatus {
  if (
    todo?.status === "todo" ||
    todo?.status === "in_progress" ||
    todo?.status === "done"
  ) {
    return todo.status;
  }
  return todo?.completed ? "done" : "todo";
}

type Props = {
  todo: Todo;
  formatDueDate: (value?: string | null) => string;
  onStatusChange: (todo: Todo, nextStatus: TodoStatus) => void;
  onEdit: (
    todo: Todo,
    updates: {
      text: string;
      dueDate: string | null;
      priority: TodoPriority;
      tags: string[];
    },
  ) => Promise<void> | void;
  onDelete: (todo: Todo) => void;
  normalizeStatus?: (todo: Todo) => TodoStatus;
  actionsDisabled?: boolean;
};

export default function TodoItem({
  todo,
  formatDueDate,
  onStatusChange,
  onEdit,
  onDelete,
  normalizeStatus,
  actionsDisabled = false,
}: Props) {
  const status = normalizeStatus ? normalizeStatus(todo) : defaultNormalizeStatus(todo);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    text: string;
    dueDate: string;
    priority: TodoPriority;
    tagsInput: string;
  }>({
    text: String(todo?.text || ""),
    dueDate: todo?.dueDate ? String(todo.dueDate).slice(0, 10) : "",
    priority: todo?.priority || "medium",
    tagsInput: Array.isArray(todo?.tags) ? todo.tags.join(", ") : "",
  });

  function openEdit() {
    setDraft({
      text: String(todo?.text || ""),
      dueDate: todo?.dueDate ? String(todo.dueDate).slice(0, 10) : "",
      priority: todo?.priority || "medium",
      tagsInput: Array.isArray(todo?.tags) ? todo.tags.join(", ") : "",
    });
    setEditError(null);
    setIsEditing(true);
  }

  function closeEdit() {
    setIsEditing(false);
    setSaving(false);
    setEditError(null);
  }

  async function handleSaveEdit() {
    const text = String(draft.text || "").trim();
    if (!text) {
      setEditError("Task text is required.");
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      await onEdit(todo, {
        text,
        dueDate: draft.dueDate || null,
        priority: draft.priority || "medium",
        tags: parseTagInput(draft.tagsInput),
      });
      closeEdit();
    } catch (err) {
      setEditError((err as Error).message || "Unable to update task.");
      setSaving(false);
    }
  }

  const controlsDisabled = actionsDisabled || saving;

  return (
    <li
      className={`grid gap-3 rounded-2xl border border-border bg-sand px-4 py-3 transition sm:grid-cols-[1fr_auto] ${
        status === "done" ? "opacity-80" : ""
      }`}
    >
      <div className="min-w-0">
        {isEditing ? (
          <div className="space-y-2.5">
            <input
              type="text"
              value={draft.text}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, text: event.target.value }))
              }
              disabled={controlsDisabled}
              className="w-full rounded-xl border border-border bg-[#f2f8fd] px-3 py-2 text-sm text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
              placeholder="Task text"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                type="date"
                value={draft.dueDate}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, dueDate: event.target.value }))
                }
                disabled={controlsDisabled}
                className="w-full rounded-xl border border-border bg-[#f2f8fd] px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
              />
              <select
                value={draft.priority}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    priority: event.target.value as TodoPriority,
                  }))
                }
                disabled={controlsDisabled}
                className="w-full rounded-xl border border-border bg-[#f2f8fd] px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <input
                type="text"
                value={draft.tagsInput}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, tagsInput: event.target.value }))
                }
                disabled={controlsDisabled}
                placeholder="tags, comma, separated"
                className="w-full rounded-xl border border-border bg-[#f2f8fd] px-3 py-2 text-sm text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
              />
            </div>
            {editError ? <p className="text-xs text-red-700">{editError}</p> : null}
          </div>
        ) : (
          <>
            <p
              className={status === "done" ? "text-bark line-through" : "text-ink"}
            >
              {todo?.text || "No text"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  statusStyles[status]
                }`}
              >
                {statusOptions.find((option) => option.value === status)?.label ||
                  "To do"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  priorityStyles[todo?.priority || "medium"]
                }`}
              >
                {(todo?.priority || "medium").toUpperCase()}
              </span>
              <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs text-bark">
                {formatDueDate(todo?.dueDate)}
              </span>
              {(todo?.tags || []).map((tag) => (
                <span
                  key={`${todo?._id}-${tag}`}
                  className="rounded-full bg-emberSoft px-2.5 py-1 text-xs text-ink"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <label className="sr-only" htmlFor={`status-${todo?._id}`}>
          Status
        </label>
        <select
          id={`status-${todo?._id}`}
          value={status}
          onChange={(event) =>
            onStatusChange(todo, event.target.value as TodoStatus)
          }
          disabled={controlsDisabled || isEditing}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {isEditing ? (
          <>
            <button
              type="button"
              className="text-sm text-emerald-700 transition hover:text-emerald-900 disabled:opacity-60"
              onClick={handleSaveEdit}
              disabled={controlsDisabled}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="text-sm text-bark transition hover:text-ink disabled:opacity-60"
              onClick={closeEdit}
              disabled={controlsDisabled}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className="text-sm text-bark transition hover:text-ink"
            onClick={openEdit}
            disabled={controlsDisabled}
          >
            Edit
          </button>
        )}
        <button
          type="button"
          className="text-sm text-bark transition hover:text-ink"
          onClick={() => onDelete(todo)}
          disabled={controlsDisabled}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
