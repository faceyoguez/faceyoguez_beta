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
import { ThemeToggle } from '@/components/theme-toggle';

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
    { label: 'LMS', icon: BookOpen, path: '/instructor/lms' },
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
      <div className="flex min-h-[100dvh] bg-background selection:bg-primary-container selection:text-primary">
        
        {/* Mobile Header (Hamburger Menu) */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant/10 z-40 flex items-center justify-between px-4 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-secondary shadow-sm ring-1 ring-secondary-container/50">
              <Flower2 className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Faceyoguez
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 text-foreground/50 hover:text-foreground focus:outline-none transition-colors"
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
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-surface-container-lowest/80 backdrop-blur-3xl ring-1 ring-outline-variant/10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out
            ${collapsed ? 'w-[72px] hidden lg:flex' : 'w-72'} 
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Logo Handle */}
          <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-outline-variant/10 px-5">
            <Link href="/" className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary-container text-secondary shadow-sm ring-1 ring-secondary-container/50">
                <Flower2 className="h-5 w-5" />
              </div>
              {!collapsed && (
                <span className="text-xl font-bold tracking-tight text-foreground">
                  Faceyoguez
                </span>
              )}
            </Link>
            <button
              onClick={() => setCollapsed((p) => !p)}
              className="hidden lg:flex h-8 w-8 items-center justify-center text-foreground/40 transition-colors hover:text-foreground"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button
               onClick={() => setMobileMenuOpen(false)}
               className="lg:hidden p-2 text-foreground/40 hover:text-foreground"
            >
               <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
            {!collapsed && (
              <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-widest text-foreground/40">
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
                      className={`group flex items-center gap-3.5 rounded-[1.25rem] px-3.5 py-3 text-[13px] font-semibold transition-all duration-200 ${
                        isActive
                        ? 'bg-primary/10 text-primary shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] ring-1 ring-primary/20 backdrop-blur-md'
                        : isLocked
                          ? 'text-foreground/30 cursor-not-allowed bg-surface-container/30'
                          : 'text-foreground/60 hover:bg-surface-container-high/50 hover:text-foreground'
                        } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 transition-all ${
                          isActive
                          ? 'text-primary'
                          : isLocked
                            ? 'text-foreground/20'
                            : 'text-foreground/40 group-hover:text-foreground/70'
                          }`}
                      />
                      {!collapsed && <span className="flex-1">{label}</span>}
                      {!collapsed && label === 'Broadcasts' && unreadNotificationsCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-error-container text-error text-[10px] font-bold shadow-sm ring-1 ring-error/20">
                          {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                        </span>
                      )}
                      {collapsed && label === 'Broadcasts' && unreadNotificationsCount > 0 && (
                        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-error shadow-sm ring-2 ring-surface-container-lowest"></span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="shrink-0 px-4 pb-2">
            <ThemeToggle collapsed={collapsed} />
          </div>

          {/* User Profile */}
          <div className="shrink-0 border-t border-outline-variant/10 p-4">
            <div
              className={`flex items-center gap-3 rounded-[1.5rem] bg-surface-container-low/50 p-3 ring-1 ring-outline-variant/15 shadow-sm backdrop-blur-md transition-all hover:bg-surface-container-low/80 ${collapsed ? 'justify-center' : ''
                }`}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-10 w-10 shrink-0 rounded-[1rem] object-cover shadow-sm ring-1 ring-outline-variant/20"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-secondary-container text-sm font-extrabold text-secondary shadow-sm ring-1 ring-secondary/20">
                  {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-extrabold text-foreground">
                    {user.full_name}
                  </p>
                  <p className="text-[11px] font-medium capitalize text-foreground/50 tracking-wide mt-0.5">
                    {user.role === 'client_management' ? 'Client Management' : user.role.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
              {!collapsed && (
                <form action="/auth/logout" method="post">
                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] text-foreground/40 transition-colors hover:bg-surface hover:text-error hover:shadow-sm ring-1 ring-transparent hover:ring-outline-variant/10"
                    title="Log out"
                  >
                    <LogOut className="h-[14px] w-[14px]" />
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
