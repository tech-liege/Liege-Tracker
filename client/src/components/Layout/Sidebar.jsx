import { NavLink } from "react-router-dom";
import { useSession } from "../../context/SessionContext";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/auth", label: "Authentication" },
];

export default function Sidebar() {
  const { session, logout } = useSession();

  return (
    <aside className="hidden fixed left-0 top-0 h-[95dvh] w-64 flex-col gap-8 border-r border-border bg-white/70 px-6 py-10 backdrop-blur lg:flex">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">
          Liege-Tracker
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Workspace</h1>
        <p className="mt-2 text-sm text-bark">
          Keep tabs on tasks and status updates.
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-emberSoft text-ink"
                  : "text-bark hover:bg-emberSoft/60 hover:text-ink"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-border bg-sand p-4 text-sm text-bark">
        <p className="text-xs uppercase tracking-[0.2em] text-bark">Session</p>
        <p className="mt-2 text-sm text-ink">
          {session ? session.user.email : "Guest"}
        </p>
        {session ? (
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-ink transition hover:border-ember/60 hover:text-ember"
          >
            Sign out
          </button>
        ) : null}
      </div>
    </aside>
  );
}
