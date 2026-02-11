import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchMe,
  getStoredToken,
  loginUser,
  registerUser,
  storeToken,
} from "../api";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
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

  async function login(email, password) {
    const data = await loginUser(email, password);
    storeToken(data.token);
    setSession({ token: data.token, user: data.user });
    return data;
  }

  async function register(email, password) {
    const data = await registerUser(email, password);
    storeToken(data.token);
    setSession({ token: data.token, user: data.user });
    return data;
  }

  function logout() {
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
    }),
    [session, checkingSession],
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
