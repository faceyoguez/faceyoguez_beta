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
    { label: 'Plans & Pricing', icon: CreditCard, path: '/student/plans' },
    { label: '1-on-1 Classes', icon: User, path: '/student/one-on-one' },
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
    { label: 'Broadcast', icon: Megaphone, path: '/staff/broadcast' },
    { label: 'LMS', icon: BookOpen, path: '/staff/lms' },
  ],
  staff: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
    { label: '1-on-1', icon: User, path: '/staff/one-on-one' },
    { label: 'Chat', icon: MessageSquare, path: '/instructor/chat' },
    { label: 'Groups', icon: Users, path: '/staff/groups' },
    { label: 'Broadcast', icon: Megaphone, path: '/staff/broadcast' },
    { label: 'LMS', icon: BookOpen, path: '/staff/lms' },
  ],
  client_management: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
    { label: '1-on-1', icon: User, path: '/staff/one-on-one' },
    { label: 'Chat', icon: MessageSquare, path: '/instructor/chat' },
    { label: 'Groups', icon: Users, path: '/staff/groups' },
    { label: 'Broadcast', icon: Megaphone, path: '/staff/broadcast' },
    { label: 'LMS', icon: BookOpen, path: '/staff/lms' },
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
  isTrial?: boolean;
  children: React.ReactNode;
}

export function AppSidebar({ 
  user, 
  activePlans = [], 
  unreadNotificationsCount = 0, 
  isTrial = false,
  children 
}: AppSidebarProps) {
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
      <div className="flex h-[100dvh] overflow-hidden bg-background selection:bg-primary-container selection:text-primary">
        
        {/* Mobile Header (Hamburger Menu) */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant/10 z-40 flex items-center justify-between px-6 shadow-sm">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
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
            className="fixed inset-0 bg-black/5 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-surface-container-low/50 backdrop-blur-3xl transition-all duration-500 ease-in-out border-r border-outline-variant/10
            ${collapsed ? 'w-[80px] hidden lg:flex' : 'w-72'} 
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            bg-white/60 backdrop-blur-3xl
          `}
        >
          {/* Logo Handle */}
          <div className="flex h-[88px] shrink-0 items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-3 overflow-hidden group px-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                <Flower2 className="h-6 w-6" />
              </div>
              {!collapsed && (
                <span className="text-2xl font-serif font-bold tracking-tight text-primary italic">
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
                      className={`group flex items-center gap-4 rounded-[1.5rem] px-4 py-3.5 text-[13px] font-bold transition-all duration-500 ${
                        isActive
                        ? 'bg-primary text-white shadow-xl scale-[1.02] shadow-primary/20'
                        : isLocked
                          ? 'text-foreground/20 cursor-not-allowed'
                          : 'text-foreground/50 hover:bg-primary/5 hover:text-primary'
                        } ${collapsed ? 'justify-center mx-2' : ''}`}
                    >
                      <Icon
                        className={`h-[20px] w-[20px] shrink-0 transition-transform duration-500 group-hover:scale-110 ${
                          isActive
                          ? 'text-background'
                          : isLocked
                            ? 'text-foreground/10'
                            : 'text-foreground/30'
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

          <div className="shrink-0 pt-4 px-4 pb-0">
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[11px] font-medium capitalize text-foreground/50 tracking-wide">
                      {user.role === 'client_management' ? 'Client Management' : user.role.replace(/_/g, ' ')}
                    </p>
                    {isTrial && (
                      <span className="text-[9px] font-black uppercase text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 leading-none">
                        Trial
                      </span>
                    )}
                  </div>
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
          className={`flex-1 overflow-y-auto h-full transition-all duration-300 ease-in-out w-full
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
