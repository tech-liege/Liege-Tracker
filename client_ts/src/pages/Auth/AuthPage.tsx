import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useLayout } from "@/context/LayoutContext";
import { useSession } from "@/context/SessionContext";
import { loadGoogleIdentityScript } from "@/utils/googleIdentity";

const authModes = ["login", "register"] as const;

export default function AuthPage() {
  const {
    session,
    pendingGuestSync,
    checkingSession,
    login,
    googleSignIn,
    register,
    continueAsGuest,
    resolveGuestTodoSync,
  } = useSession();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  const googleEnabled = Boolean(googleClientId);
  const { setStatus } = useLayout();
  const [authMode, setAuthMode] = useState<(typeof authModes)[number]>("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const waitingForGuestSync = Boolean(pendingGuestSync);

  useEffect(() => {
    if (!googleEnabled || !googleButtonRef.current) return;

    let cancelled = false;

    loadGoogleIdentityScript()
      .then((google) => {
        if (cancelled || !googleButtonRef.current || !google.accounts?.id) return;

        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential?: string }) => {
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
              setAuthError((err as Error).message);
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
          setAuthError((err as Error).message || "Unable to load Google sign-in.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [googleClientId, googleEnabled, googleSignIn]);

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

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    setAuthMessage(null);
    try {
      if (authMode === "login") {
        await login(email, password);
      } else {
        const response = await register(email, password);
        setAuthMessage(
          response?.message || "Account created. Check your email to verify your account.",
        );
        setAuthMode("login");
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleGuestSyncChoice(shouldSync: boolean) {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await resolveGuestTodoSync(shouldSync);
    } catch (err) {
      setAuthError((err as Error).message);
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
      setAuthError((err as Error).message);
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
    return (
      <Navigate
        to={session.user?.isVerified === false ? "/settings" : "/dashboard"}
        replace
      />
    );
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
                setAuthMessage(null);
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
      <div className="mt-4">
        <div className="h-px bg-border" />
        <div className="py-3">
          {googleEnabled ? (
            <div
              ref={googleButtonRef}
              className={`flex justify-center ${
                authBusy || waitingForGuestSync
                  ? "mx-auto w-full min-w-0 pointer-events-none opacity-70"
                  : "mx-auto w-full min-w-0"
              }`}
            />
          ) : (
            <p className="text-center text-xs text-bark">
              Google sign-in is not configured.
            </p>
          )}
        </div>
        <div className="h-px bg-border" />
      </div>
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
      {authMessage ? (
        <p className="mt-4 text-sm text-emerald-700">{authMessage}</p>
      ) : null}

      {waitingForGuestSync ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-soft">
            <h3 className="text-xl font-semibold text-ink">
              Sync guest tasks?
            </h3>
            <p className="mt-2 text-sm text-bark">
              We found {pendingGuestSync?.guestTodos.length || 0} local guest
              task
              {(pendingGuestSync?.guestTodos.length || 0) === 1 ? "" : "s"}. Do
              you want to sync them to this account?
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
