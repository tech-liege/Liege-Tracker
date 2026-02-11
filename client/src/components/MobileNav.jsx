import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/auth", label: "Authentication" },
];

export default function MobileNav() {
  return (
    <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm font-semibold shadow-soft backdrop-blur lg:hidden">
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
