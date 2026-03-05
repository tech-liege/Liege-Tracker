import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyAccount } from "@/api";

export default function VerifyAccountPage() {
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
        setError((err as Error).message || "Invalid or expired verification link.");
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
    <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">
        Account verification
      </p>
      <h2 className="mt-2 text-xl font-semibold text-ink">Verify your account</h2>

      {busy ? <p className="mt-4 text-sm text-bark">Verifying your account...</p> : null}
      {!busy && message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      {!busy && error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {!busy ? (
        <Link to="/auth" className="mt-4 inline-block text-sm font-medium text-ink underline">
          Go to sign in
        </Link>
      ) : null}
    </section>
  );
}
