import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyAccount } from "@/api";

export default function VerifyAccountPage() {
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function runVerification() {
      if (!token) {
        if (!mounted) return;
        setError("This verification link is invalid.");
        setBusy(false);
        return;
      }

      try {
        const response = await verifyAccount(token);
        if (!mounted) return;
        setMessage(response?.message || "Account verified successfully. You can now sign in.");
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Invalid or expired verification link.");
      } finally {
        if (mounted) {
          setBusy(false);
        }
      }
    }

    runVerification();

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <section className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-white/95 p-6 shadow-soft sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bark">Account verification</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Verify your account</h1>

      {busy ? <p className="mt-4 text-sm text-bark">Verifying your account...</p> : null}

      {!busy && message ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      ) : null}

      {!busy && error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!busy ? (
        <Link to="/auth" className="mt-5 inline-block text-sm font-semibold text-bark underline transition hover:text-ember">
          Go to sign in
        </Link>
      ) : null}
    </section>
  );
}
