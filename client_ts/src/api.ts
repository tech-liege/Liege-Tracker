import type {
  AuthResponse,
  RegistrationResponse,
  Roadmap,
  RoadmapPlan,
  Session,
  Todo,
  User,
} from "./types";

const tokenKey = "liege_token";
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);

function toApiUrl(path: string): string {
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

export async function createTodo(
  input:
    | string
    | {
        text?: string;
        dueDate?: string | null;
        tags?: string[];
        priority?: string;
        status?: string;
      },
): Promise<Todo> {
  const payload =
    typeof input === "string"
      ? { text: input }
      : {
          text: input?.text,
          dueDate: input?.dueDate || null,
          tags: Array.isArray(input?.tags) ? input.tags : [],
          priority: input?.priority,
          status: input?.status,
        };

  const res = await fetch(toApiUrl("/todos"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleJson<Todo>(res);
}

export async function updateTodo(
  id: string,
  updates: Partial<Todo> & { status?: string; completed?: boolean },
): Promise<Todo> {
  const res = await fetch(toApiUrl(`/todos/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(updates),
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

export async function registerUser(
  email: string,
  password: string,
): Promise<RegistrationResponse> {
  const res = await fetch(toApiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleJson<RegistrationResponse>(res);
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(toApiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleJson<AuthResponse>(res);
}

export async function verifyAccount(token: string): Promise<{ message?: string }> {
  const params = new URLSearchParams({ token });
  const res = await fetch(toApiUrl(`/auth/verify-account?${params}`));
  return handleJson<{ message?: string }>(res);
}

export async function requestAccountVerification(
  email: string,
): Promise<{ message?: string }> {
  const res = await fetch(toApiUrl("/auth/verify-account/request"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleJson<{ message?: string }>(res);
}

export async function fetchMe(): Promise<User> {
  const res = await fetch(toApiUrl("/auth/me"), { headers: authHeaders() });
  return handleJson<User>(res);
}

export async function fetchRoadmaps(): Promise<Roadmap[]> {
  const res = await fetch(toApiUrl("/roadmaps"), { headers: authHeaders() });
  return handleJson<Roadmap[]>(res);
}

export async function previewRoadmapFromGoal(
  goal: string,
): Promise<{ goal: string; roadmapPlan: RoadmapPlan }> {
  const res = await fetch(toApiUrl("/roadmaps/preview"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ goal }),
  });
  return handleJson<{ goal: string; roadmapPlan: RoadmapPlan }>(res);
}

export async function createRoadmapFromPlan(
  goal: string,
  roadmapPlan: RoadmapPlan,
): Promise<{ roadmap: Roadmap; todos: Todo[] }> {
  const res = await fetch(toApiUrl("/roadmaps"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ goal, roadmapPlan }),
  });
  return handleJson<{ roadmap: Roadmap; todos: Todo[] }>(res);
}

export type { Session };
