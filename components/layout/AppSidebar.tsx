'use client';

import { useState, createContext, useContext, useEffect } from 'react';
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
  Menu,
  X
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
    { label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
    { label: '1-on-1', icon: User, path: '/staff/one-on-one' },
    { label: 'Chat', icon: MessageSquare, path: '/instructor/chat' },
    { label: 'Groups', icon: Users, path: '/staff/groups' },
    { label: 'Broadcast', icon: Megaphone, path: '/instructor/broadcast' },
    { label: 'LMS', icon: BookOpen, path: '/instructor/lms' },
  ],
  staff: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
    { label: '1-on-1', icon: User, path: '/staff/one-on-one' },
    { label: 'Chat', icon: MessageSquare, path: '/instructor/chat' },
    { label: 'Groups', icon: Users, path: '/staff/groups' },
    { label: 'Broadcast', icon: Megaphone, path: '/instructor/broadcast' },
  ],
  client_management: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
    { label: '1-on-1', icon: User, path: '/staff/one-on-one' },
    { label: 'Chat', icon: MessageSquare, path: '/instructor/chat' },
    { label: 'Groups', icon: Users, path: '/staff/groups' },
    { label: 'Broadcast', icon: Megaphone, path: '/instructor/broadcast' },
    { label: 'LMS', icon: BookOpen, path: '/instructor/lms' },
  ],
  sales_team: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/instructor/dashboard' },
  ],
  marketing_team: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/instructor/dashboard' },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const links = navConfig[user.role as keyof typeof navConfig] || navConfig.student;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed((p) => !p) }}>
      <div className="flex min-h-screen bg-[#FAF9F6] selection:bg-[#e8c6c8] selection:text-[#1a1a1a]">
        
        {/* Mobile Header (Hamburger Menu) */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-[#f4e8e5] z-40 flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f4e8e5] text-[#2d3748]">
              <Flower2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-serif font-bold tracking-tight text-gray-900">
              Faceyoguez
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#f4e8e5] bg-white transition-all duration-300 ease-in-out
            ${collapsed ? 'w-[72px] hidden lg:flex' : 'w-72'} 
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Logo Handle */}
          <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#f4e8e5] px-5">
            <Link href="/" className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f4e8e5] text-[#2d3748]">
                <Flower2 className="h-5 w-5" />
              </div>
              {!collapsed && (
                <span className="text-xl font-serif font-bold tracking-tight text-gray-900">
                  Faceyoguez
                </span>
              )}
            </Link>
            <button
              onClick={() => setCollapsed((p) => !p)}
              className="hidden lg:flex h-8 w-8 items-center justify-center text-gray-400 transition-colors hover:text-gray-900"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button
               onClick={() => setMobileMenuOpen(false)}
               className="lg:hidden p-2 text-gray-400 hover:text-gray-900"
            >
               <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto px-4 py-8">
            {!collapsed && (
              <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Menu
              </p>
            )}
            <ul className="space-y-1.5">
              {links.map(({ label, icon: Icon, path }) => {
                const isActive = pathname === path || pathname?.startsWith(path + '/');

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
                      className={`group flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                        ? 'bg-[#f4e8e5]/60 text-[#2d3748] shadow-sm font-semibold'
                        : isLocked
                          ? 'text-gray-300 cursor-not-allowed bg-gray-50/50'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <Icon
                        className={`h-5 w-5 shrink-0 transition-colors ${
                          isActive
                          ? 'text-[#2d3748]'
                          : isLocked
                            ? 'text-gray-200'
                            : 'text-gray-400 group-hover:text-gray-600'
                          }`}
                      />
                      {!collapsed && <span className="flex-1">{label}</span>}
                      {!collapsed && label === 'Broadcasts' && unreadNotificationsCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e8c6c8] text-[#2d3748] text-[10px] font-bold">
                          {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                        </span>
                      )}
                      {collapsed && label === 'Broadcasts' && unreadNotificationsCount > 0 && (
                        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#e8c6c8] ring-2 ring-white"></span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="shrink-0 border-t border-[#f4e8e5] p-4">
            <div
              className={`flex items-center gap-3 rounded-2xl bg-[#faf9f6] p-3 border border-gray-100/50 shadow-sm ${collapsed ? 'justify-center' : ''
                }`}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4e8e5] text-sm font-bold text-[#2d3748] ring-2 ring-white shadow-sm">
                  {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {user.full_name}
                  </p>
                  <p className="text-[11px] font-medium capitalize text-gray-500 tracking-wide mt-0.5">
                    {user.role === 'client_management' ? 'Client Management' : user.role.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
              {!collapsed && (
                <form action="/auth/logout" method="post">
                  <button
                    type="submit"
                    className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white hover:text-red-500 hover:shadow-sm"
                    title="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main content wrapper ── */}
        <main
          className={`flex-1 transition-all duration-300 ease-in-out w-full
            pt-16 lg:pt-0 
            ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-72'}
          `}
        >
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
