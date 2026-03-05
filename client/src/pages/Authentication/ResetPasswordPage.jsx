import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Field } from "@/components/ui";
import { confirmPasswordReset, validatePasswordResetToken } from "@/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();

  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenError, setTokenError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let mounted = true;

    async function validateToken() {
      if (!token) {
        if (!mounted) return;
        setTokenError("This reset link is invalid.");
        setCheckingToken(false);
        return;
      }

      try {
        await validatePasswordResetToken(token);
        if (!mounted) return;
        setTokenError(null);
      } catch (err) {
        if (!mounted) return;
        setTokenError(err.message || "Invalid or expired reset link.");
      } finally {
        if (mounted) {
          setCheckingToken(false);
        }
      }
    }

    validateToken();

    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const response = await confirmPasswordReset(token, password, confirmPassword);
      setSuccessMessage(response.message || "Password reset successful.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-white/95 p-6 shadow-soft sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bark">Password reset</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Create a new password</h1>

      {checkingToken ? <p className="mt-4 text-sm text-bark">Checking reset link...</p> : null}

      {!checkingToken && tokenError ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{tokenError}</p>
          <Link to="/auth/forgot-password" className="mt-2 inline-block underline">
            Request a new reset link
          </Link>
        </div>
      ) : null}

      {!checkingToken && !tokenError ? (
        <>
          <p className="mt-2 text-sm text-bark">Enter your new password below. This link expires 15 minutes after it was sent.</p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
            <Field
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password (min 8 characters)"
              disabled={busy}
              required
            />
            <Field
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              disabled={busy}
              required
            />
            <Button type="submit" disabled={busy} className="w-full justify-center py-3">
              {busy ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          {successMessage ? (
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{successMessage}</p>
          ) : null}

          {formError ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}

          <Link to="/auth" className="mt-5 inline-block text-sm font-semibold text-bark underline transition hover:text-ember">
            Back to sign in
          </Link>
        </>
      ) : null}
    </section>
  );
}
