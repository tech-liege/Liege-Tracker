import { handleJson, toApiUrl } from "./func";

export async function registerUser(email, password, confirmPassword) {
  const res = await fetch(toApiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, confirmPassword }),
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

export async function loginWithGoogle(credential) {
  const res = await fetch(toApiUrl("/auth/google"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  return handleJson(res);
}

export async function requestPasswordReset(email) {
  const res = await fetch(toApiUrl("/auth/password-reset/request"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleJson(res);
}

export async function validatePasswordResetToken(token) {
  const params = new URLSearchParams({ token });
  const res = await fetch(toApiUrl(`/auth/password-reset/validate?${params}`));
  return handleJson(res);
}

export async function confirmPasswordReset(token, password, confirmPassword) {
  const res = await fetch(toApiUrl("/auth/password-reset/confirm"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password, confirmPassword }),
  });
  return handleJson(res);
}

export async function verifyAccount(token) {
  const params = new URLSearchParams({ token });
  const res = await fetch(toApiUrl(`/auth/verify-account?${params}`));
  return handleJson(res);
}

export async function requestAccountVerification(email) {
  const res = await fetch(toApiUrl("/auth/verify-account/request"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleJson(res);
}
