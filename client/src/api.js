const baseUrl = "http://localhost:4000/api/todos";
const authUrl = "http://localhost:4000/api/auth";
const tokenKey = "liege_token";

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
  const res = await fetch(baseUrl, { headers: authHeaders() });
  return handleJson(res);
}

export async function createTodo(text) {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ text }),
  });
  return handleJson(res);
}

export async function toggleTodo(id, completed) {
  const res = await fetch(`${baseUrl}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ completed }),
  });
  return handleJson(res);
}

export async function deleteTodo(id) {
  const res = await fetch(`${baseUrl}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleJson(res);
}

export async function registerUser(email, password) {
  const res = await fetch(`${authUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleJson(res);
}

export async function loginUser(email, password) {
  const res = await fetch(`${authUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleJson(res);
}

export async function fetchMe() {
  const res = await fetch(`${authUrl}/me`, { headers: authHeaders() });
  return handleJson(res);
}
