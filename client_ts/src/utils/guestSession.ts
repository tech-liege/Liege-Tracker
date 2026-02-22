import type { Session, Todo, User } from "../types";

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

export function isGuestToken(token: string | null): boolean {
  return token === guestSessionToken;
}

export function isGuestSession(session: Session | null): boolean {
  return Boolean(session?.user?.isGuest);
}

export function loadGuestTodos(): Todo[] {
  const currentValue = localStorage.getItem(guestTodosKey);
  const raw = currentValue || localStorage.getItem(legacyGuestTodosKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const todos = parsed as Todo[];
    if (!currentValue) {
      saveGuestTodos(todos);
    }
    return todos;
  } catch (_err) {
    return [];
  }
}

export function saveGuestTodos(todos: Todo[]): void {
  localStorage.setItem(guestTodosKey, JSON.stringify(todos));
}

export function createGuestTodo(text: string): Todo {
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
