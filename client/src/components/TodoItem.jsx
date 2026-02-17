export default function TodoItem({
  todo,
  priorityStyles,
  formatDueDate,
  onToggle,
  onDelete,
}) {
  return (
    <li
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-border bg-sand px-4 py-3 transition ${
        todo?.completed ? "opacity-80" : ""
      }`}
    >
      <button
        type="button"
        aria-pressed={todo?.completed}
        onClick={() => onToggle(todo)}
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
          todo?.completed
            ? "border-ember bg-ember text-white"
            : "border-ember bg-white text-transparent hover:shadow-[0_8px_16px_rgba(217,115,66,0.25)]"
        }`}
      >
        ✓
      </button>
      <div className="min-w-0">
        <span
          className={todo?.completed ? "text-bark line-through" : "text-ink"}
        >
          {todo?.text || "No Text"}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              priorityStyles[todo?.priority] || priorityStyles.medium
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
      </div>
      <button
        type="button"
        className="text-sm text-bark transition hover:text-ink"
        onClick={() => onDelete(todo)}
      >
        Delete
      </button>
    </li>
  );
}
