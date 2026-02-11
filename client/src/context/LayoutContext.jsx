import { createContext, useContext, useMemo, useState } from "react";

const LayoutContext = createContext(null);

const defaultStatus = {
  title: "Ready",
  detail: "Idle",
  meta: "",
};

export function LayoutProvider({ children }) {
  const [status, setStatus] = useState(defaultStatus);

  const value = useMemo(() => ({ status, setStatus }), [status]);

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within LayoutProvider");
  }
  return context;
}
