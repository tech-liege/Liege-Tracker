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
  fetchMe,
  getStoredToken,
  loginUser,
  registerUser,
  storeToken,
} from "../api";
import {
  getGuestSessionToken,
  getGuestUser,
  isGuestToken,
} from "../utils/guestSession";
import type { AuthResponse, Session } from "../types";

type SessionContextValue = {
  session: Session | null;
  checkingSession: boolean;
  login: (email?: string, password?: string) => Promise<AuthResponse | Session>;
  register: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  continueAsGuest: () => Session;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
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

  const continueAsGuest = useCallback((): Session => {
    const token = getGuestSessionToken();
    const guestSession = { token, user: getGuestUser() };
    storeToken(token);
    setSession(guestSession);
    return guestSession;
  }, []);

  async function login(email = "", password = ""): Promise<AuthResponse | Session> {
    if (String(email).trim().toLowerCase() === "guest") {
      return continueAsGuest();
    }

    const data = await loginUser(email, password);
    storeToken(data.token);
    setSession({ token: data.token, user: data.user });
    return data;
  }

  async function register(email: string, password: string): Promise<AuthResponse> {
    const data = await registerUser(email, password);
    storeToken(data.token);
    setSession({ token: data.token, user: data.user });
    return data;
  }

  function logout(): void {
    storeToken(null);
    setSession(null);
  }

  const value = useMemo(
    () => ({
      session,
      checkingSession,
      login,
      register,
      logout,
      continueAsGuest,
    }),
    [session, checkingSession, continueAsGuest],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
