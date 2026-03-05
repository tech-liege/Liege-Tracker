import type { Todo, TodoStatus } from "@/types";
import type { RoadmapPlan, TodoPriority, DraftMilestone, DraftPlan } from "@/types";

function normalizeStatus(todo: Todo): TodoStatus {
  if (todo?.status === "todo" || todo?.status === "in_progress" || todo?.status === "done") {
    return todo.status;
  }
  return todo?.completed ? "done" : "todo";
}

function normalizePriority(value: unknown): TodoPriority {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }
  return "medium";
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const unique = new Set<string>();
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

function toDateInput(value: unknown): string {
  if (!value) return "";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    const raw = String(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
  }
  return parsed.toISOString().slice(0, 10);
}

function normalizePlan(plan: RoadmapPlan | null | undefined, goal: string): DraftPlan {
  const rawMilestones = Array.isArray(plan?.milestones) ? plan.milestones : [];
  const milestones: DraftMilestone[] = rawMilestones.map((milestone, milestoneIndex) => {
    const rows = Array.isArray(milestone?.todos) ? milestone.todos : [];
    return {
      title: String(milestone?.title || `Milestone ${milestoneIndex + 1}`).trim(),
      description: String(milestone?.description || "").trim(),
      startDate: toDateInput((milestone as { startDate?: string | null })?.startDate),
      endDate: toDateInput((milestone as { endDate?: string | null })?.endDate),
      todos: rows.map((todo, todoIndex) => ({
        text: String(todo?.text || `Task ${todoIndex + 1}`).trim(),
        dueDate: toDateInput(todo?.dueDate),
        priority: normalizePriority(todo?.priority),
        tags: normalizeTags(todo?.tags),
      })),
    };
  });

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
