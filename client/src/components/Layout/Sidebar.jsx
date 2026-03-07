import { NavLink } from "react-router-dom";
import { DashboardIcon, RoadmapIcon, SettingsIcon, TasksIcon } from "../ui/icons";
import { useSession } from "@/context/SessionContext";
import { isGuestSession } from "@/utils/guestSession";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/roadmaps", label: "Roadmaps", icon: RoadmapIcon },
  { to: "/tasks", label: "Tasks", icon: TasksIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  const { session, logout } = useSession();
  const guestMode = isGuestSession(session);
  const unverifiedMode = Boolean(session && !guestMode && session.user?.isVerified === false);

  return (
    <aside className="hidden fixed inset-y-0 left-0 w-64 flex-col border-r border-border/80 bg-sand px-5 py-6 lg:flex">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bark">Liege-Tracker</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Operations</h1>
        <p className="mt-2 text-sm text-bark">Strategy and execution workspace.</p>
      </div>

      <nav className="mt-8 flex flex-col gap-1.5">
        {navItems.map((item) => {
          const disabled = unverifiedMode && item.to !== "/settings";

          if (disabled) {
            return (
              <div key={item.to} className="rounded-xl px-3 py-2 text-sm font-semibold text-bark/60">
                <span className="inline-flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </span>
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-ink text-white" : "text-bark hover:bg-clay hover:text-ink"}`
              }
            >
              <span className="inline-flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-border bg-clay p-4 text-sm text-bark">
        <p className="text-xs uppercase tracking-[0.22em] text-bark">Session</p>
        <p className="mt-2 truncate text-sm font-semibold text-ink">{session ? session.user.email : "Guest"}</p>
        {guestMode ? <p className="mt-2 text-xs text-bark">Guest mode: AI features disabled.</p> : null}
        {unverifiedMode ? <p className="mt-2 text-xs text-bark">Unverified: features are locked in Settings.</p> : null}
        {session ? (
          <button
            type="button"
            onClick={logout}
            className="mt-4 w-full rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink hover:text-ink"
          >
            Sign out
          </button>
        ) : null}
      </div>
    </aside>
  );
}
