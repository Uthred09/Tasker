import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Tag,
  Settings,
  CheckCheck,
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/todos", icon: CheckSquare, label: "Todos" },
  { to: "/categories", icon: Tag, label: "Categories" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppLayout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        {/* Brand */}
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <CheckCheck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Tasker
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-2 pt-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-sidebar-border p-3">
          <UserButton afterSignOutUrl="/" />
          <ThemeToggle />
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
