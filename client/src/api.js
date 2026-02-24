const tokenKey = "liege_token";
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

function toApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

export function getStoredToken() {
  return localStorage.getItem(tokenKey);
}

export function storeToken(token) {
  if (token) {
    localStorage.setItem(tokenKey, token);
  } else {
    localStorage.removeItem(tokenKey);
  }
}

function authHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleJson(res) {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  return res.json();
}

export async function fetchTodos() {
  const res = await fetch(toApiUrl("/todos"), { headers: authHeaders() });
  return handleJson(res);
}

export async function createTodo(input) {
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
  return handleJson(res);
}

export async function updateTodo(id, updates) {
  const res = await fetch(toApiUrl(`/todos/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(updates),
  });
  return handleJson(res);
}

export async function deleteTodo(id) {
  const res = await fetch(toApiUrl(`/todos/${id}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleJson(res);
}

export async function registerUser(email, password) {
  const res = await fetch(toApiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleJson(res);
}

export async function loginUser(email, password) {
  const res = await fetch(toApiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleJson(res);
}

export async function fetchMe() {
  const res = await fetch(toApiUrl("/auth/me"), { headers: authHeaders() });
  return handleJson(res);
}

export async function fetchRoadmaps() {
  const res = await fetch(toApiUrl("/roadmaps"), { headers: authHeaders() });
  return handleJson(res);
}

export async function previewRoadmapFromGoal(goal) {
  const res = await fetch(toApiUrl("/roadmaps/preview"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ goal }),
  });
  return handleJson(res);
}

export async function createRoadmapFromPlan(goal, roadmapPlan) {
  const res = await fetch(toApiUrl("/roadmaps"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ goal, roadmapPlan }),
  });
  return handleJson(res);
}
