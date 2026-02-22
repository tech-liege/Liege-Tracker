import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";
import type { LayoutStatus } from "../types";

type LayoutContextValue = {
  status: LayoutStatus;
  setStatus: Dispatch<SetStateAction<LayoutStatus>>;
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

export function useLayout(): LayoutContextValue {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within LayoutProvider");
  }
  return context;
}
