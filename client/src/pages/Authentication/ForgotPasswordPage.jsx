import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Field } from "@/components/ui";
import { requestPasswordReset } from "@/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message || "If the email exists, a reset link has been sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-white/95 p-6 shadow-soft sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bark">Password reset</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Forgot password?</h1>
      <p className="mt-2 text-sm text-bark">Enter your account email and we&apos;ll send a reset link that expires in 15 minutes.</p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
        <Field type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" disabled={busy} required />
        <Button type="submit" disabled={busy} className="w-full justify-center py-3">
          {busy ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      {message ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}

      {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <Link to="/auth" className="mt-5 inline-block text-sm font-semibold text-bark underline transition hover:text-ember">
        Back to sign in
      </Link>
    </section>
  );
}
