import type { Todo } from "./types";

const baseUrl = "/api/todos";

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  return (await res.json()) as T;
}

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(baseUrl);
  return handleJson<Todo[]>(res);
}

export async function createTodo(text: string): Promise<Todo> {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  return handleJson<Todo>(res);
}

export async function toggleTodo(id: string, completed: boolean): Promise<Todo> {
  const res = await fetch(`${baseUrl}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed })
  });
  return handleJson<Todo>(res);
}

export async function deleteTodo(id: string): Promise<{ deleted: boolean }>{
  const res = await fetch(`${baseUrl}/${id}`, { method: "DELETE" });
  return handleJson<{ deleted: boolean }>(res);
}
