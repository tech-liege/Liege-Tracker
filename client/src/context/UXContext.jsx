import { createContext, useContext, useEffect, useMemo, useState } from "react";

const UXContext = createContext(null);

export function UXProvider({ children }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleOnlineStatus = () => {
      setIsOnline(window.navigator.onLine);
    };

    handleOnlineStatus();
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);
    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  const value = useMemo(() => ({ isOnline, setIsOnline }), [isOnline]);

  return <UXContext.Provider value={value}>{children}</UXContext.Provider>;
}

export function useUX() {
  const context = useContext(UXContext);
  if (!context) {
    throw new Error("useUX must be used within UXProvider");
  }
  return context;
}
