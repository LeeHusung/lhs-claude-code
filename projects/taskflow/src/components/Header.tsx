"use client";

import { Bell, Clock, Pin, Check } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import clsx from "clsx";

interface Notification {
  id: number;
  user_id: number;
  task_id: number | null;
  type: string;
  message: string;
  read: number;
  created_at: string;
  task_title?: string;
}

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "방금";
  if (diffMins < 60) return `${diffMins}분 전`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}

export default function Header({ title, children }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications?unread_count=true")
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((data) => setUnreadCount(data.count ?? 0));
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    }
    if (showPanel) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPanel]);

  async function togglePanel() {
    if (showPanel) {
      setShowPanel(false);
      return;
    }
    setShowPanel(true);
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoadingNotifs(false);
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PUT" });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  }

  return (
    <header className="h-16 bg-surface border-b border-border-subtle flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        )}
        {children}
      </div>

      <div className="flex items-center gap-3 relative" ref={panelRef}>
        {/* Notification bell */}
        <button
          onClick={togglePanel}
          className={clsx(
            "relative p-2 rounded-lg transition-colors",
            showPanel
              ? "bg-surface-hover text-text-primary"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          )}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification dropdown */}
        {showPanel && (
          <div className="absolute top-full right-0 mt-2 w-96 bg-surface border border-border rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <h3 className="text-sm font-semibold text-text-primary">알림</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  <Check size={12} />
                  모두 읽음
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loadingNotifs ? (
                <div className="py-8 text-center text-text-tertiary text-sm">
                  불러오는 중...
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell size={24} className="mx-auto mb-2 text-text-tertiary" />
                  <p className="text-text-tertiary text-sm">새 알림이 없습니다</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={clsx(
                      "px-4 py-3 border-b border-border-subtle last:border-b-0 transition-colors",
                      notif.read ? "opacity-60" : "bg-surface-hover/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={clsx(
                        "mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                        notif.type === "due_soon" ? "bg-warning/15 text-warning" : "bg-info/15 text-info"
                      )}>
                        {notif.type === "due_soon" ? <Clock size={14} /> : <Pin size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary leading-snug">
                          {notif.message}
                        </p>
                        <p className="text-xs text-text-tertiary mt-1">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
