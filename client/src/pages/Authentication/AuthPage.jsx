import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { BoltIcon, Button, Field, SparkIcon, TasksIcon, UserIcon } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { loadGoogleIdentityScript } from "@/utils/googleIdentity";

const authModes = ["login", "register"];

export default function AuthPage() {
  const { session, pendingGuestSync, checkingSession, login, googleSignIn, register, continueAsGuest, resolveGuestTodoSync } = useSession();
  const googleButtonRef = useRef(null);
  const googleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  const googleEnabled = Boolean(googleClientId);
  const [authMode, setAuthMode] = useState("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authMessage, setAuthMessage] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const waitingForGuestSync = Boolean(pendingGuestSync);

  useEffect(() => {
    if (!googleEnabled || !googleButtonRef.current) return;

    let cancelled = false;

    loadGoogleIdentityScript()
      .then((google) => {
        if (cancelled || !googleButtonRef.current) return;

        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            const credential = String(response?.credential || "").trim();
            if (!credential) {
              setAuthError("Google sign-in failed. Please try again.");
              return;
            }

            setAuthBusy(true);
            setAuthError(null);
            setAuthMessage(null);
            try {
              await googleSignIn(credential);
            } catch (err) {
              setAuthError(err.message);
            } finally {
              setAuthBusy(false);
            }
          },
        });

        googleButtonRef.current.innerHTML = "";
        google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: Math.min(360, googleButtonRef.current.clientWidth || 280),
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setAuthError(err.message || "Unable to load Google sign-in.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [googleClientId, googleEnabled, googleSignIn]);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    setAuthMessage(null);
    try {
      if (authMode === "register" && password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      if (authMode === "login") {
        await login(email, password);
      } else {
        const response = await register(email, password, confirmPassword);
        setAuthMessage(response?.message || "Account created. Check your email to verify your account.");
        setAuthMode("login");
      }

      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleGuestSyncChoice(shouldSync) {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await resolveGuestTodoSync(shouldSync);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function toGuest() {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await continueAsGuest();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  }

  if (checkingSession) {
    return (
      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-sm text-bark">Checking session...</p>
      </section>
    );
  }

  if (session) {
    return <Navigate to={session.user?.isVerified === false ? "/settings" : "/dashboard"} replace />;
  }

  return (
    <section className="ui-enter grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <article className="relative overflow-hidden rounded-3xl bg-ink px-6 py-8 text-white shadow-[0_30px_70px_rgba(16,42,67,0.34)] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-ember/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[#1c7c8e]/35 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/90">Liege-Tracker</p>
        <h1 className="mt-4 max-w-md text-3xl font-semibold leading-tight sm:text-4xl">
          {authMode === "login" ? "Welcome back. Let’s keep momentum." : "Create your workspace in under a minute."}
        </h1>
        <p className="mt-4 max-w-md text-sm text-cyan-50/85">
          {authMode === "login"
            ? "Open your dashboard, sync your priorities, and move tasks forward."
            : "Sign up to store tasks in the cloud and unlock AI roadmap generation."}
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-50/80">
              <SparkIcon className="h-4 w-4" />
              Core
            </p>
            <p className="mt-2 text-sm font-semibold text-white">AI roadmap drafts + execution board</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-50/80">
              <TasksIcon className="h-4 w-4" />
              Guest
            </p>
            <p className="mt-2 text-sm font-semibold text-white">Try the workflow before creating an account</p>
          </article>
        </div>
      </article>

      <article className="rounded-3xl border border-border bg-white/95 p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-bark">
              <UserIcon className="h-4 w-4" />
              Authentication
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{authMode === "login" ? "Sign in" : "Create an account"}</h2>
          </div>
          {authModes.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                authMode === mode ? "border-transparent bg-emberSoft text-ink" : "border-border text-bark hover:border-ember/50 hover:text-ink"
              }`}
              onClick={() => {
                setAuthMode(mode);
                setAuthError(null);
                setAuthMessage(null);
                setPassword("");
                setConfirmPassword("");
              }}
            >
              {mode === "login" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuthSubmit} className="mt-6 grid gap-3">
          <Field
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={authBusy || waitingForGuestSync}
          />
          <Field
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={authBusy || waitingForGuestSync}
          />
          {authMode === "register" ? (
            <Field
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={authBusy || waitingForGuestSync}
            />
          ) : null}
          {authMode === "login" ? (
            <Link to="/auth/forgot-password" className="text-right text-xs font-semibold text-bark underline transition hover:text-ember">
              Forgot password?
            </Link>
          ) : null}
          <Button type="submit" disabled={authBusy || waitingForGuestSync} className="mt-1 w-full justify-center py-3">
            <BoltIcon className="h-4 w-4" />
            {authMode === "login" ? "Sign in to Workspace" : "Create Account"}
          </Button>
        </form>

        <div className="mt-4">
          <div className="h-px bg-border" />
          <div className="py-3">
            {googleEnabled ? (
              <div
                ref={googleButtonRef}
                className={`mx-auto w-full min-w-0 flex justify-center ${authBusy || waitingForGuestSync ? "pointer-events-none opacity-70" : ""}`}
              />
            ) : (
              <p className="text-center text-xs text-bark">Google sign-in is not configured.</p>
            )}
          </div>
          <div className="h-px bg-border" />
        </div>

        <Button
          type="button"
          variant="ghost"
          className="mt-3 block w-full text-center"
          onClick={toGuest}
          disabled={authBusy || waitingForGuestSync}
        >
          Continue as Guest
        </Button>

        {authError ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p> : null}
        {authMessage ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{authMessage}</p>
        ) : null}
      </article>

      {waitingForGuestSync ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-soft">
            <h3 className="text-xl font-semibold text-ink">Sync guest tasks?</h3>
            <p className="mt-2 text-sm text-bark">
              We found {pendingGuestSync.guestTodos.length} local guest task
              {pendingGuestSync.guestTodos.length === 1 ? "" : "s"}. Do you want to sync them to this account?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleGuestSyncChoice(false)}
                disabled={authBusy}
                className="rounded-2xl border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:border-ember/50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => handleGuestSyncChoice(true)}
                disabled={authBusy}
                className="rounded-2xl bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
