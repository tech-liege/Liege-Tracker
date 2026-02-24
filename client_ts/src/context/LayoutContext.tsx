import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { LayoutStatus } from "../types";

type LayoutContextValue = {
  status: LayoutStatus;
  setStatus: (status: LayoutStatus) => void;
};

const defaultStatus: LayoutStatus = {
  title: "Ready",
  detail: "Idle",
  meta: "",
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LayoutStatus>(defaultStatus);
  const value = useMemo(() => ({ status, setStatus }), [status]);
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within LayoutProvider");
  }
  return context;
}
