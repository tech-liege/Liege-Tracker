const priorityStyles = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-sky-100 text-sky-700",
  high: "bg-rose-100 text-rose-700",
};

const statusStyles = {
  todo: "border-slate-300 bg-slate-50 text-slate-700",
  in_progress: "border-blue-300 bg-blue-50 text-blue-700",
  done: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

const statusOptions = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function TodoItem({
  todo,
  formatDueDate,
  onStatusChange,
  onDelete,
  normalizeStatus,
  actionsDisabled = false,
  className = "",
}) {
  const status = normalizeStatus(todo);
  const classes = [
    `grid gap-3 rounded-2xl border border-border bg-white px-4 py-3 transition sm:grid-cols-[1fr_auto] ${
      status === "done" ? "opacity-80" : ""
    }`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={classes}>
      <div className="min-w-0">
        <p
          className={`text-sm leading-relaxed ${
            status === "done" ? "text-bark line-through" : "text-ink"
          }`}
        >
          {todo?.text || "No text"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
              statusStyles[status] || statusStyles.todo
            }`}
          >
            {statusOptions.find((option) => option.value === status)?.label ||
              "To do"}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              priorityStyles[todo?.priority] || priorityStyles.medium
            }`}
          >
            {(todo?.priority || "medium").toUpperCase()}
          </span>
          <span className="rounded-full bg-[#e6f1fa] px-2.5 py-1 text-xs text-bark">
            {formatDueDate(todo?.dueDate)}
          </span>
          {(todo?.tags || []).map((tag) => (
            <span
              key={`${todo?._id}-${tag}`}
              className="rounded-full bg-[#d7efe9] px-2.5 py-1 text-xs text-ink"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <label className="sr-only" htmlFor={`status-${todo?._id}`}>
          Status
        </label>
        <select
          id={`status-${todo?._id}`}
          value={status}
          onChange={(event) => onStatusChange(todo, event.target.value)}
          disabled={actionsDisabled}
          className="rounded-xl border border-border bg-[#f2f8fd] px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="text-sm font-medium text-bark transition hover:text-ink"
          onClick={() => onDelete(todo)}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
