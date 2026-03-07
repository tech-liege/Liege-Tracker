import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createTodo, fetchMe, getStoredToken, loginUser, loginWithGoogle, registerUser, storeToken } from "@/api";
import { getGuestSessionToken, getGuestUser, isGuestToken, loadGuestTodos, saveGuestTodos } from "@/utils/guestSession";

const SessionContext = createContext(null);

function toTodoPayload(todo) {
  return {
    text: String(todo?.text || "").trim(),
    dueDate: todo?.dueDate || null,
    tags: Array.isArray(todo?.tags) ? todo.tags : [],
    priority: todo?.priority,
    status: todo?.status,
  };
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [pendingGuestSync, setPendingGuestSync] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }

    if (isGuestToken(token)) {
      setSession({ token, user: getGuestUser() });
      setCheckingSession(false);
      return;
    }

    setCheckingSession(true);
    fetchMe()
      .then((user) => {
        setSession({ token, user });
      })
      .catch(() => {
        storeToken(null);
        setSession(null);
      })
      .finally(() => {
        setCheckingSession(false);
      });
  }, []);

  const continueAsGuest = useCallback(() => {
    const token = getGuestSessionToken();
    const guestSession = { token, user: getGuestUser() };
    storeToken(token);
    setSession(guestSession);
    return guestSession;
  }, []);

  function startAuthenticatedSession(data) {
    storeToken(data.token);
    const guestTodos = loadGuestTodos();

    if (guestTodos.length) {
      setPendingGuestSync({
        token: data.token,
        user: data.user,
        guestTodos,
      });
      return { ...data, pendingGuestSync: true };
    }

    setSession({ token: data.token, user: data.user });
    return { ...data, pendingGuestSync: false };
  }

  async function login(email = "", password = "") {
    if (String(email).trim().toLowerCase() === "guest") {
      return continueAsGuest();
    }

    const data = await loginUser(email, password);
    return startAuthenticatedSession(data);
  }

  async function googleSignIn(credential = "") {
    const data = await loginWithGoogle(credential);
    return startAuthenticatedSession(data);
  }

  async function register(email, password, confirmPassword) {
    const data = await registerUser(email, password, confirmPassword);
    if (data?.token && data?.user) {
      storeToken(data.token);
      setSession({ token: data.token, user: data.user });
    }
    return data;
  }

  function logout() {
    storeToken(null);
    setSession(null);
    setPendingGuestSync(null);
  }

  const resolveGuestTodoSync = useCallback(
    async (shouldSync) => {
      if (!pendingGuestSync) return;

      const { token, user, guestTodos } = pendingGuestSync;
      if (shouldSync) {
        const syncTargets = guestTodos
          .map((todo) => ({ source: todo, payload: toTodoPayload(todo) }))
          .filter(({ payload }) => Boolean(payload.text));

        const results = await Promise.allSettled(
          syncTargets.map(({ payload }) => createTodo(payload)),
        );
        const failedTodos = results
          .map((result, index) => ({ result, todo: syncTargets[index]?.source }))
          .filter(({ result }) => result.status === "rejected")
          .map(({ todo }) => todo)
          .filter(Boolean);

        if (failedTodos.length) {
          saveGuestTodos(failedTodos);
          setPendingGuestSync((previous) =>
            previous ? { ...previous, guestTodos: failedTodos } : previous,
          );
          throw new Error(
            `Unable to sync ${failedTodos.length} guest task${
              failedTodos.length === 1 ? "" : "s"
            }.`,
          );
        }

        saveGuestTodos([]);
      }

      setPendingGuestSync(null);
      setSession({ token, user });
    },
    [pendingGuestSync],
  );

  const value = useMemo(
    () => ({
      session,
      pendingGuestSync,
      checkingSession,
      login,
      googleSignIn,
      register,
      logout,
      continueAsGuest,
      resolveGuestTodoSync,
    }),
    [
      session,
      pendingGuestSync,
      checkingSession,
      continueAsGuest,
      resolveGuestTodoSync,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
