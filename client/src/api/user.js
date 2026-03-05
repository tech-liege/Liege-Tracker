import { authHeaders, handleJson, toApiUrl } from "./func";

export async function fetchMe() {
  const res = await fetch(toApiUrl("/user/me"), { headers: authHeaders() });
  return handleJson(res);
}

export async function sendEmailAlert(subject, text, html) {
  const res = await fetch(toApiUrl("/user/sendEmailAlert"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ subject, text, html }),
  });
  return handleJson(res);
}
