import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../store';
import NotificationBell from './NotificationBell';

const navItems = [
  { to: '/board', label: '보드', icon: '▦' },
  { to: '/dashboard', label: '대시보드', icon: '◐' },
  { to: '/team', label: '팀원', icon: '◉' },
];

function getInitials(name: string) {
  return name.slice(0, 1);
}

export default function Layout() {
  const { user, setUser } = useUser();
  const location = useLocation();
  const pageTitle = navItems.find(n => n.to === location.pathname)?.label ?? '';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[200px] flex-shrink-0 bg-sidebar flex flex-col">
        <div className="px-5 py-5">
          <h1 className="text-[15px] font-semibold text-sidebar-text-active tracking-tight">
            TaskFlow
          </h1>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors ${
                  isActive
                    ? 'bg-sidebar-hover text-sidebar-text-active font-medium'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
                }`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="px-3 py-4 border-t border-sidebar-hover">
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-sidebar-text-active truncate">{user.name}</p>
                <p className="text-[11px] text-sidebar-text truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => setUser(null)}
              className="mt-2 w-full text-left px-2 py-1 text-[11px] text-sidebar-text hover:text-sidebar-text-active transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 flex items-center justify-between px-6 border-b border-border bg-surface-card flex-shrink-0">
          <h2 className="text-[15px] font-semibold text-text-primary">{pageTitle}</h2>
          <div className="flex items-center gap-3">
            <NotificationBell />
            {user && (
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[11px] font-semibold text-white">
                {user.name.slice(0, 1)}
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
