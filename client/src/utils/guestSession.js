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
    if (!currentValue) {
      saveGuestTodos(parsed);
    }
    return parsed;
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

  return {
    _id: id,
    text,
    completed: false,
    dueDate: null,
    tags: [],
    priority: "medium",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
