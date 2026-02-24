import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createTodo,
  fetchMe,
  getStoredToken,
  loginUser,
  registerUser,
  storeToken,
} from "../api";
import type { Session, Todo, User } from "../types";
import {
  getGuestSessionToken,
  getGuestUser,
  isGuestToken,
  loadGuestTodos,
  saveGuestTodos,
} from "../utils/guestSession";

type PendingGuestSync = {
  token: string;
  user: User;
  guestTodos: Todo[];
};

type SessionContextValue = {
  session: Session | null;
  pendingGuestSync: PendingGuestSync | null;
  checkingSession: boolean;
  login: (email?: string, password?: string) => Promise<Session>;
  register: (email: string, password: string) => Promise<Session>;
  logout: () => void;
  continueAsGuest: () => Session;
  resolveGuestTodoSync: (shouldSync: boolean) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function toTodoPayload(todo: Todo) {
  return {
    text: String(todo?.text || "").trim(),
    dueDate: todo?.dueDate || null,
    tags: Array.isArray(todo?.tags) ? todo.tags : [],
    priority: todo?.priority,
    status: todo?.status,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [pendingGuestSync, setPendingGuestSync] =
    useState<PendingGuestSync | null>(null);
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
    const guestSession: Session = { token, user: getGuestUser() };
    storeToken(token);
    setPendingGuestSync(null);
    setSession(guestSession);
    return guestSession;
  }, []);

  async function login(email = "", password = ""): Promise<Session> {
    if (String(email).trim().toLowerCase() === "guest") {
      return continueAsGuest();
    }

    const data = await loginUser(email, password);
    const nextSession: Session = { token: data.token, user: data.user };
    storeToken(data.token);

    const guestTodos = loadGuestTodos();
    if (guestTodos.length) {
      setPendingGuestSync({
        token: data.token,
        user: data.user,
        guestTodos,
      });
      return nextSession;
    }

    setSession(nextSession);
    return nextSession;
  }

  async function register(email: string, password: string): Promise<Session> {
    const data = await registerUser(email, password);
    const nextSession: Session = { token: data.token, user: data.user };
    storeToken(data.token);
    setSession(nextSession);
    return nextSession;
  }

  function logout() {
    storeToken(null);
    setSession(null);
    setPendingGuestSync(null);
  }

  const resolveGuestTodoSync = useCallback(
    async (shouldSync: boolean) => {
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
          .map((result, index) => ({
            result,
            todo: syncTargets[index]?.source,
          }))
          .filter(({ result }) => result.status === "rejected")
          .map(({ todo }) => todo)
          .filter(Boolean) as Todo[];

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
