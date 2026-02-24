import type { Todo, TodoPriority, TodoStatus, User } from "../types";

const guestSessionToken = "guest-local-session";
const guestTodosKey = "liege_guest_todos";
const legacyGuestTodosKey = "todos";

const guestUser: User = {
  id: "guest_id",
  email: "guest",
  isGuest: true,
};

export function getGuestSessionToken(): string {
  return guestSessionToken;
}

export function getGuestUser(): User {
  return guestUser;
}

export function isGuestToken(token: string | null | undefined): boolean {
  return token === guestSessionToken;
}

export function isGuestSession(
  session: { user?: User } | null | undefined,
): boolean {
  return Boolean(session?.user?.isGuest);
}

export function loadGuestTodos(): Todo[] {
  const currentValue = localStorage.getItem(guestTodosKey);
  const raw = currentValue || localStorage.getItem(legacyGuestTodosKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed
      .map((todo, index) => normalizeGuestTodo(todo, index))
      .filter(Boolean) as Todo[];
    if (!currentValue) {
      saveGuestTodos(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
}

export function saveGuestTodos(todos: Todo[]) {
  localStorage.setItem(guestTodosKey, JSON.stringify(todos));
}

export function createGuestTodo(
  input:
    | string
    | {
        text?: string;
        dueDate?: string | null;
        tags?: string[];
        priority?: string;
        status?: string;
      },
): Todo {
  const timestamp = new Date().toISOString();
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.round(Math.random() * 100000)}`;

  const raw =
    typeof input === "string"
      ? {
          text: input,
          dueDate: null,
          tags: [],
          priority: "medium",
          status: "todo",
        }
      : {
          text: input?.text,
          dueDate: input?.dueDate || null,
          tags: Array.isArray(input?.tags) ? input.tags : [],
          priority: input?.priority,
          status: input?.status,
        };

  const status = normalizeStatus(raw.status, false);

  return {
    _id: id,
    text: String(raw.text || "").trim(),
    completed: status === "done",
    status,
    dueDate: raw.dueDate,
    tags: normalizeTags(raw.tags),
    priority: normalizePriority(raw.priority),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function normalizeGuestTodo(todo: unknown, fallbackIndex: number): Todo | null {
  if (!todo || typeof todo !== "object") return null;
  const row = todo as Record<string, unknown>;
  const text = String(row.text || "").trim();
  if (!text) return null;
  const fallbackId = `guest-${fallbackIndex}`;
  const status = normalizeStatus(row.status, Boolean(row.completed));
  return {
    _id: String(row._id || fallbackId),
    text,
    completed: status === "done",
    status,
    dueDate: (row.dueDate as string | null | undefined) || null,
    tags: normalizeTags(Array.isArray(row.tags) ? (row.tags as string[]) : []),
    priority: normalizePriority(row.priority),
    createdAt:
      (row.createdAt as string | undefined) || new Date().toISOString(),
    updatedAt:
      (row.updatedAt as string | undefined) || new Date().toISOString(),
  };
}

function normalizePriority(value: unknown): TodoPriority {
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

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set<string>();
  for (const tag of value) {
    const normalized = String(tag || "")
      .trim()
      .toLowerCase();
    if (!normalized) continue;
    unique.add(normalized);
    if (unique.size >= 8) break;
  }
  return [...unique];
}

function normalizeStatus(status: unknown, completed: boolean): TodoStatus {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();
  if (
    normalized === "todo" ||
    normalized === "in_progress" ||
    normalized === "done"
  ) {
    return normalized;
  }
  return completed ? "done" : "todo";
}
