function normalizeStatus(todo) {
  if (
    todo?.status === "todo" ||
    todo?.status === "in_progress" ||
    todo?.status === "done"
  ) {
    return todo.status;
  }
  return todo?.completed ? "done" : "todo";
}

function normalizePriority(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (
    normalized === "low" ||
    normalized === "high" ||
    normalized === "medium"
  ) {
    return normalized;
  }
  return "medium";
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const unique = new Set();
  for (const tag of tags) {
    const normalized = String(tag || "")
      .trim()
      .toLowerCase();
    if (!normalized) continue;
    unique.add(normalized);
    if (unique.size >= 6) break;
  }
  return [...unique];
}

function toDateInput(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const raw = String(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
  }
  return parsed.toISOString().slice(0, 10);
}

function normalizePlan(plan, goal) {
  const rawMilestones = Array.isArray(plan?.milestones) ? plan.milestones : [];
  const milestones = rawMilestones.map((milestone, milestoneIndex) => ({
    title: String(milestone?.title || `Milestone ${milestoneIndex + 1}`).trim(),
    description: String(milestone?.description || "").trim(),
    startDate: toDateInput(milestone?.startDate),
    endDate: toDateInput(milestone?.endDate),
    todos: Array.isArray(milestone?.todos)
      ? milestone.todos.map((todo, todoIndex) => ({
          text: String(todo?.text || `Task ${todoIndex + 1}`).trim(),
          dueDate: toDateInput(todo?.dueDate),
          priority: normalizePriority(todo?.priority),
          tags: normalizeTags(todo?.tags),
        }))
      : [],
  }));

  return {
    goal: String(goal || "").trim(),
    title: String(plan?.title || "").trim(),
    summary: String(plan?.summary || "").trim(),
    milestones,
  };
}

export default {
  status: normalizeStatus,
  plan: normalizePlan,
  priority: normalizePriority,
  tags: normalizeTags,
  toDateInput,
};
