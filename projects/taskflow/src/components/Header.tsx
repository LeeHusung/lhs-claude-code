"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export default function Header({ title, children }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications?unread_count=true")
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((data) => setUnreadCount(data.count ?? 0));
  }, []);

  return (
    <header className="h-16 bg-surface border-b border-border-subtle flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        )}
        {children}
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell — will be enhanced by Task 8 */}
        <button
          className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          id="notification-bell"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
