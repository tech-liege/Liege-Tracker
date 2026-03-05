import { NavLink } from "react-router-dom";
import {
  DashboardIcon,
  RoadmapIcon,
  SettingsIcon,
  TasksIcon,
} from "../ui/icons";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/roadmaps", label: "Roadmaps", icon: RoadmapIcon },
  { to: "/tasks", label: "Tasks", icon: TasksIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 gap-1 border-t border-border bg-sand/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 text-xs font-semibold shadow-soft lg:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-xl px-2 py-2 transition ${
              isActive
                ? "bg-ember text-white"
                : "text-bark hover:bg-clay hover:text-ink"
            }`
          }
        >
          <span className="flex flex-col items-center gap-1">
            <item.icon className="h-4 w-4" />
            <span className="text-[11px] leading-none">{item.label}</span>
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
