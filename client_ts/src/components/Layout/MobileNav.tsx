import { NavLink } from "react-router-dom";
import { useSession } from "@/context/SessionContext";

const authenticatedNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/roadmaps", label: "Roadmaps" },
  { to: "/tasks", label: "Tasks" },
  { to: "/settings", label: "Settings" },
];
const unauthenticatedNavItems = [{ to: "/auth", label: "Authentication" }];

export default function MobileNav() {
  const { session } = useSession();
  const navItems = session ? authenticatedNavItems : unauthenticatedNavItems;

  return (
    <nav className="flex flex-wrap sticky top-2 z-50 items-center gap-2 rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm font-semibold shadow-soft backdrop-blur-[2px] lg:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-full px-3 py-1 transition ${
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
  );
}
