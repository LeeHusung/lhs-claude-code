import { useEffect, useState } from 'react';
import type { Member } from '../types';
import { api } from '../api';
import { useUser } from '../store';

function getInitials(name: string) {
  return name.slice(0, 1);
}

const AVATAR_COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e'];

export default function LoginPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { setUser } = useUser();

  useEffect(() => {
    api.members.getAll().then(m => { setMembers(m); setLoading(false); });
  }, []);

  const handleLogin = async () => {
    if (selected === null) return;
    const user = await api.auth.login(selected);
    setUser(user);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="text-sidebar-text text-sm">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">TaskFlow</h1>
          <p className="text-sm text-slate-400">팀을 선택하여 시작하세요</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {members.slice(0, 3).map((m, i) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`group flex flex-col items-center gap-2.5 p-4 rounded-lg border transition-all duration-150 ${
                selected === m.id
                  ? 'border-accent bg-accent/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
              }`}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: AVATAR_COLORS[i] }}
              >
                {getInitials(m.name)}
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">{m.name}</p>
                <p className="text-[11px] text-slate-400">{m.role}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-[340px] mx-auto mb-8">
          {members.slice(3, 5).map((m, i) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`group flex flex-col items-center gap-2.5 p-4 rounded-lg border transition-all duration-150 ${
                selected === m.id
                  ? 'border-accent bg-accent/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
              }`}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: AVATAR_COLORS[i + 3] }}
              >
                {getInitials(m.name)}
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">{m.name}</p>
                <p className="text-[11px] text-slate-400">{m.role}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleLogin}
            disabled={selected === null}
            className={`px-8 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
              selected !== null
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
