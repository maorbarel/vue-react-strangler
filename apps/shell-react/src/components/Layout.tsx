import { NavLink, Outlet } from "react-router";
import { isMigrated } from "../migration/routes-map";

const NAV_ITEMS = [
  { to: "/legacy/dashboard", label: "Dashboard" },
  { to: "/legacy/reports?range=week", label: "Reports" },
  { to: "/legacy/reports/archive", label: "Archive (redirect)" },
  { to: "/settings", label: "Settings" },
  { to: "/profile", label: "Profile" },
] as const;

export function Layout() {
  return (
    <div className="shell">
      <header className="shell-header">
        <strong>Strangler shell</strong>
        <nav className="shell-nav">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink key={to} to={to}>
              {label}
              <span className={`tag ${isMigrated(to) ? "tag-react" : "tag-vue"}`}>
                {isMigrated(to) ? "React" : "Vue"}
              </span>
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
