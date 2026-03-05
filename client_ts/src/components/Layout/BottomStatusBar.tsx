import { useLocation } from "react-router-dom";
import { useLayout } from "@/context/LayoutContext";
import { useSession } from "@/context/SessionContext";

const routeLabels: Record<string, string> = {
  "/": "Redirecting",
  "/dashboard": "Dashboard",
  "/roadmaps": "Roadmaps",
  "/tasks": "Tasks",
  "/settings": "Settings",
  "/auth": "Authentication",
};

export default function BottomStatusBar() {
  const { status } = useLayout();
  const { session } = useSession();
  const location = useLocation();
  const routeLabel = routeLabels[location.pathname] || "Workspace";

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-bark sm:text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-ink">{status?.title}</span>
          <span>{status?.detail}</span>
          {status?.meta ? <span>• {status.meta}</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span>{routeLabel}</span>
          <span>•</span>
          <span>{session ? session.user.email : "Guest"}</span>
        </div>
      </div>
    </div>
  );
}
