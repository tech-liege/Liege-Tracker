import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useLayout } from "../../context/LayoutContext";
import { useSession } from "../../context/SessionContext";

const authModes = ["login", "register"];

export default function AuthPage() {
  const {
    session,
    pendingGuestSync,
    checkingSession,
    login,
    register,
    continueAsGuest,
    resolveGuestTodoSync,
  } = useSession();
  const { setStatus } = useLayout();
  const [authMode, setAuthMode] = useState("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const waitingForGuestSync = Boolean(pendingGuestSync);

  useEffect(() => {
    if (checkingSession) {
      setStatus({
        title: "Authentication",
        detail: "Checking session",
        meta: "Hold tight",
      });
      return;
    }

    if (session) {
      setStatus({
        title: "Authenticated",
        detail: "Session active",
        meta: session.user.email,
      });
      return;
    }

    setStatus({
      title: "Authentication",
      detail:
        authMode === "login" ? "Sign in to continue" : "Create an account",
      meta: "Guest",
    });
  }, [authMode, checkingSession, session, setStatus]);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    try {
      const action = authMode === "login" ? login : register;
      await action(email, password);
      setEmail("");
      setPassword("");
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
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section className="ui-enter rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">
            Liege-Tracker
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">
            {authMode === "login" ? "Sign in" : "Create an account"}
          </h2>
          <p className="mt-1 text-sm text-bark">
            {authMode === "login"
              ? "Access your personal todo list."
              : "Start tracking tasks with a new account."}
          </p>
        </div>
        <div className="flex gap-2">
          {authModes.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                authMode === mode
                  ? "border-transparent bg-emberSoft text-ink"
                  : "border-border text-bark hover:border-ember/50 hover:text-ink"
              }`}
              onClick={() => {
                setAuthMode(mode);
                setAuthError(null);
              }}
            >
              {mode === "login" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleAuthSubmit}
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
      >
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={authBusy || waitingForGuestSync}
          className="w-full rounded-2xl border border-border bg-sand px-4 py-3 text-base text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={authBusy || waitingForGuestSync}
          className="w-full rounded-2xl border border-border bg-sand px-4 py-3 text-base text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
        />
        <button
          type="submit"
          disabled={authBusy || waitingForGuestSync}
          className="rounded-2xl bg-ember px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(217,115,66,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {authMode === "login" ? "Sign in" : "Register"}
        </button>
      </form>
      <button
        type="button"
        className="mx-auto mt-4 block text-sm font-medium text-ink underline"
        onClick={toGuest}
        disabled={authBusy || waitingForGuestSync}
      >
        Continue as Guest
      </button>

      {authError ? (
        <p className="mt-4 text-sm text-red-700">{authError}</p>
      ) : null}

      {waitingForGuestSync ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-soft">
            <h3 className="text-xl font-semibold text-ink">Sync guest tasks?</h3>
            <p className="mt-2 text-sm text-bark">
              We found {pendingGuestSync.guestTodos.length} local guest task
              {pendingGuestSync.guestTodos.length === 1 ? "" : "s"}. Do you
              want to sync them to this account?
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
