const guestSessionToken = "guest-local-session";
const guestTodosKey = "liege_guest_todos";
const legacyGuestTodosKey = "todos";

const guestUser = {
  id: "guest_id",
  email: "guest",
  isGuest: true,
};

export function getGuestSessionToken() {
  return guestSessionToken;
}

export function getGuestUser() {
  return guestUser;
}

export function isGuestToken(token) {
  return token === guestSessionToken;
}

export function isGuestSession(session) {
  return Boolean(session?.user?.isGuest);
}

export function loadGuestTodos() {
  const currentValue = localStorage.getItem(guestTodosKey);
  const raw = currentValue || localStorage.getItem(legacyGuestTodosKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed
      .map((todo, index) => normalizeGuestTodo(todo, index))
      .filter(Boolean);
    if (!currentValue) {
      saveGuestTodos(normalized);
    }
    return normalized;
  } catch (_err) {
    return [];
  }
}

export function saveGuestTodos(todos) {
  localStorage.setItem(guestTodosKey, JSON.stringify(todos));
}

export function createGuestTodo(text) {
  const timestamp = new Date().toISOString();
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.round(Math.random() * 100000)}`;

  const raw =
    typeof text === "string"
      ? {
          text,
          dueDate: null,
          tags: [],
          priority: "medium",
          status: "todo",
        }
      : {
          text: text?.text,
          dueDate: text?.dueDate || null,
          tags: Array.isArray(text?.tags) ? text.tags : [],
          priority: text?.priority,
          status: text?.status,
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

function normalizeGuestTodo(todo, fallbackIndex) {
  if (!todo || typeof todo !== "object") return null;
  const text = String(todo.text || "").trim();
  if (!text) return null;
  const fallbackId = `guest-${fallbackIndex}`;
  const status = normalizeStatus(todo.status, todo.completed);
  return {
    _id: todo._id || fallbackId,
    text,
    completed: status === "done",
    status,
    dueDate: todo.dueDate || null,
    tags: Array.isArray(todo.tags) ? todo.tags.filter(Boolean).slice(0, 8) : [],
    priority: normalizePriority(todo.priority),
    createdAt: todo.createdAt || new Date().toISOString(),
    updatedAt: todo.updatedAt || new Date().toISOString(),
  };
}

function normalizePriority(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "low" || normalized === "high" || normalized === "medium") {
    return normalized;
  }
  return "medium";
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  const unique = new Set();
  for (const tag of value) {
    const normalized = String(tag || "").trim().toLowerCase();
    if (!normalized) continue;
    unique.add(normalized);
    if (unique.size >= 8) break;
  }
  return [...unique];
}

function normalizeStatus(status, completed) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "todo" || normalized === "in_progress" || normalized === "done") {
    return normalized;
  }
  return completed ? "done" : "todo";
}
