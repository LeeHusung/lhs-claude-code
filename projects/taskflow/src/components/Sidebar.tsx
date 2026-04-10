"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, BarChart3, Users, LogOut } from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/board", label: "Board", icon: LayoutGrid },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setUser(data);
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside className="w-60 bg-surface border-r border-border-subtle flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-canvas font-bold text-sm">T</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-text-primary">
            TaskFlow
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent-muted text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>

      {/* User section */}
      {user && (
        <div className="p-3 border-t border-border-subtle">
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-canvas shrink-0"
              style={{ backgroundColor: user.avatar_color }}
            >
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user.name}
              </p>
              <p className="text-xs text-text-tertiary truncate">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
              title="로그아웃"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
