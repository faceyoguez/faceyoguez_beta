'use client';

import { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Users,
  BookOpen,
  Megaphone,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Flower2,
  CreditCard,
} from 'lucide-react';
import type { Profile } from '@/types/database';

// ── Context for sidebar state ──
const SidebarContext = createContext({ collapsed: false, toggle: () => { } });
export const useSidebar = () => useContext(SidebarContext);

// ── Nav config per role ──
const navConfig = {
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
    { label: 'Subscription Plans', icon: CreditCard, path: '/student/plans' },
    { label: '1-on-1 Plan', icon: User, path: '/student/one-on-one' },
    { label: 'Group Session', icon: Users, path: '/student/group-session' },
    { label: 'Broadcasts', icon: Megaphone, path: '/student/broadcasts' },
    { label: 'LMS', icon: BookOpen, path: '/student/lms' },
  ],
  instructor: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/instructor/dashboard' },
    { label: '1-on-1', icon: User, path: '/instructor/one-on-one' },
    { label: 'Chat', icon: MessageSquare, path: '/instructor/chat' },
    { label: 'Groups', icon: Users, path: '/instructor/groups' },
    { label: 'Broadcast', icon: Megaphone, path: '/instructor/broadcast' },
    { label: 'LMS', icon: BookOpen, path: '/instructor/lms' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/instructor/dashboard' },
    { label: '1-on-1', icon: User, path: '/instructor/one-on-one' },
    { label: 'Chat', icon: MessageSquare, path: '/instructor/chat' },
    { label: 'Groups', icon: Users, path: '/instructor/groups' },
    { label: 'Broadcast', icon: Megaphone, path: '/instructor/broadcast' },
    { label: 'LMS', icon: BookOpen, path: '/instructor/lms' },
  ],
  staff: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/instructor/dashboard' },
    { label: '1-on-1', icon: User, path: '/instructor/one-on-one' },
    { label: 'Chat', icon: MessageSquare, path: '/instructor/chat' },
    { label: 'Groups', icon: Users, path: '/instructor/groups' },
    { label: 'Broadcast', icon: Megaphone, path: '/instructor/broadcast' },
  ],
};

interface AppSidebarProps {
  user: Profile;
  activePlans?: string[];
  unreadNotificationsCount?: number;
  children: React.ReactNode;
}

export function AppSidebar({ user, activePlans = [], unreadNotificationsCount = 0, children }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const links = navConfig[user.role] || navConfig.student;

  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed((p) => !p) }}>
      <div className="flex min-h-screen bg-gradient-to-br from-rose-50/80 via-white to-pink-50/60">
        {/* ── Sidebar ── */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-pink-100/60 bg-white/80 backdrop-blur-xl transition-all duration-300 ease-in-out ${collapsed ? 'w-[68px]' : 'w-64'
            }`}
        >
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-pink-100/60 px-4">
            <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200/50">
                <Flower2 className="h-5 w-5" />
              </div>
              {!collapsed && (
                <span className="text-lg font-bold tracking-tight text-gray-900">
                  Faceyoguez
                </span>
              )}
            </Link>
            <button
              onClick={() => setCollapsed((p) => !p)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-500"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            {!collapsed && (
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Menu
              </p>
            )}
            <ul className="space-y-1">
              {links.map(({ label, icon: Icon, path }) => {
                const isActive = pathname === path || pathname?.startsWith(path + '/');

                // Subscription Check — only students need plans, and only for 1-on-1 / Group
                // Instructor/admin/staff always have full access. LMS is free for everyone.
                let requiresPlan: string | null = null;
                if (user.role === 'student') {
                  if (path.includes('one-on-one')) requiresPlan = 'one_on_one';
                  if (path.includes('group-session')) requiresPlan = 'group_session';
                }

                const isLocked = requiresPlan && !activePlans.includes(requiresPlan);
                const tooltipTitle = isLocked ? 'Buy subscription to enable access' : (collapsed ? label : undefined);

                return (
                  <li key={label}>
                    <Link
                      href={isLocked ? '#' : path}
                      onClick={(e) => { if (isLocked) e.preventDefault(); }}
                      title={tooltipTitle}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                        ? 'bg-pink-50 text-pink-600 shadow-sm shadow-pink-100/50'
                        : isLocked
                          ? 'text-gray-400 opacity-60 cursor-not-allowed bg-gray-50/50'
                          : 'text-gray-500 hover:bg-pink-50/60 hover:text-gray-700'
                        } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive
                          ? 'text-pink-500'
                          : isLocked
                            ? 'text-gray-300'
                            : 'text-gray-400 group-hover:text-pink-400'
                          }`}
                      />
                      {!collapsed && <span className="flex-1">{label}</span>}
                      {!collapsed && label === 'Broadcasts' && unreadNotificationsCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white shadow-sm shadow-pink-200">
                          {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                        </span>
                      )}
                      {collapsed && label === 'Broadcasts' && unreadNotificationsCount > 0 && (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-pink-500 ring-2 ring-white"></span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User profile */}
          <div className="shrink-0 border-t border-pink-100/60 px-3 py-4">
            <div
              className={`flex items-center gap-3 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50/50 p-2.5 ${collapsed ? 'justify-center' : ''
                }`}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-pink-200/60"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-200 text-sm font-bold text-pink-600 ring-2 ring-pink-200/60">
                  {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {user.full_name}
                  </p>
                  <p className="text-[11px] font-medium capitalize text-pink-500">
                    {user.role}
                  </p>
                </div>
              )}
              {!collapsed && (
                <form action="/auth/logout" method="post">
                  <button
                    type="submit"
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-pink-100/60 hover:text-pink-500"
                    title="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-[68px]' : 'ml-64'
            }`}
        >
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
