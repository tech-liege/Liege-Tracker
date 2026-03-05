import { authHeaders, handleJson, toApiUrl } from "./func";

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
