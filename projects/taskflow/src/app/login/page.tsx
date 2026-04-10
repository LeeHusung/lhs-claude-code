"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import clsx from "clsx";
import type { User } from "@/lib/types";

// avatar_color in DB is a hex string (e.g. "#E3B341").
// Light colors need dark text; dark/saturated colors use light text.
function getAvatarTextColor(hex: string): string {
  // Strip '#' and parse RGB
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Perceived luminance
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 140 ? "#0D1117" : "#E6EDF3";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function LoginPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggingInUserId, setLoggingInUserId] = useState<number | null>(null);

  // Check if already logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u && u.id) router.replace("/board");
      })
      .catch(() => {});
  }, [router]);

  // Load team members
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data: User[]) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, []);

  async function loginWithUser(userId: number) {
    setLoggingInUserId(userId);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "로그인에 실패했습니다");
        setLoggingInUserId(null);
        return;
      }
      router.push("/board");
    } catch {
      setError("네트워크 오류가 발생했습니다");
      setLoggingInUserId(null);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 모두 입력해주세요");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "로그인에 실패했습니다");
        return;
      }
      router.push("/board");
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(48,54,61,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(48,54,61,0.25) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo + Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent mb-5 shadow-lg shadow-accent/20">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0D1117"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Task<span className="text-accent">Flow</span>
          </h1>
          <p className="text-text-secondary mt-2 text-sm">팀 업무 관리 워크스페이스</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl shadow-black/40">
          {!showEmailForm ? (
            <>
              <h2 className="text-base font-semibold text-text-primary mb-1">
                팀원으로 시작하기
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                아바타를 클릭하면 즉시 워크스페이스에 입장합니다
              </p>

              {/* User Avatar Grid */}
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
                  {users.slice(0, 5).map((user) => {
                    const bgColor = user.avatar_color;
                    const textColor = getAvatarTextColor(bgColor);
                    const isLoading = loggingInUserId === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => loginWithUser(user.id)}
                        disabled={loggingInUserId !== null}
                        className={clsx(
                          "group flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                          "border-border-subtle hover:border-accent hover:bg-surface-hover",
                          loggingInUserId !== null && loggingInUserId !== user.id
                            ? "opacity-40"
                            : "opacity-100"
                        )}
                      >
                        {/* Avatar circle */}
                        <div className="relative">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-transform duration-200 group-hover:scale-110"
                            style={{ backgroundColor: bgColor, color: textColor }}
                          >
                            {isLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin" style={{ color: textColor }} />
                            ) : (
                              getInitials(user.name)
                            )}
                          </div>
                          {/* Online dot */}
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface" />
                        </div>
                        {/* Name */}
                        <span className="text-xs text-text-secondary text-center leading-tight group-hover:text-text-primary transition-colors line-clamp-2">
                          {user.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-center gap-2 text-danger text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border-subtle" />
                <span className="text-text-tertiary text-xs">또는</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>

              {/* Switch to email form */}
              <button
                onClick={() => { setShowEmailForm(true); setError(""); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-text-secondary text-sm hover:border-accent hover:text-text-primary hover:bg-surface-hover transition-all duration-200"
              >
                <Mail className="w-4 h-4" />
                이메일로 로그인
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setShowEmailForm(false); setError(""); setEmail(""); setPassword(""); }}
                className="flex items-center gap-1.5 text-text-secondary text-sm mb-5 hover:text-text-primary transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                팀원 선택으로 돌아가기
              </button>

              <h2 className="text-base font-semibold text-text-primary mb-1">
                이메일로 로그인
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                데모 모드 — 아무 값이나 입력해도 입장 가능합니다
              </p>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                {/* Email field */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    이메일
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className={clsx(
                        "w-full bg-canvas border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary",
                        "outline-none transition-all duration-200",
                        "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
                      )}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    비밀번호
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={clsx(
                        "w-full bg-canvas border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary",
                        "outline-none transition-all duration-200",
                        "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
                      )}
                    />
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 text-danger text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={clsx(
                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                    "bg-accent text-canvas hover:bg-accent-hover",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {submitting ? "로그인 중..." : "워크스페이스 입장"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-text-tertiary text-xs mt-6">
          TaskFlow · 팀 칸반 데모 · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
