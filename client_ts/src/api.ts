import type { AuthResponse, GenerateRoadmapResponse, Todo, User } from "./types";

const tokenKey = "liege_token";
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

function toApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(tokenKey);
}

export function storeToken(token: string | null): void {
  if (token) {
    localStorage.setItem(tokenKey, token);
  } else {
    localStorage.removeItem(tokenKey);
  }
}

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  return (await res.json()) as T;
}

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(toApiUrl("/todos"), { headers: authHeaders() });
  return handleJson<Todo[]>(res);
}

export async function createTodo(text: string): Promise<Todo> {
  const res = await fetch(toApiUrl("/todos"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ text }),
  });
  return handleJson<Todo>(res);
}

export async function toggleTodo(id: string, completed: boolean): Promise<Todo> {
  const res = await fetch(toApiUrl(`/todos/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ completed }),
  });
  return handleJson<Todo>(res);
}

export async function deleteTodo(id: string): Promise<{ deleted: boolean }> {
  const res = await fetch(toApiUrl(`/todos/${id}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleJson<{ deleted: boolean }>(res);
}

export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(toApiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleJson<AuthResponse>(res);
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(toApiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleJson<AuthResponse>(res);
}

export async function fetchMe(): Promise<User> {
  const res = await fetch(toApiUrl("/auth/me"), { headers: authHeaders() });
  return handleJson<User>(res);
}

export async function generateRoadmapFromGoal(goal: string): Promise<GenerateRoadmapResponse> {
  const res = await fetch(toApiUrl("/roadmaps/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ goal }),
  });
  return handleJson<GenerateRoadmapResponse>(res);
}
