'use client';

import { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  User,
  UserCircle,
  Users,
  BookOpen,
  Megaphone,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Flower2,
  CreditCard,
  Menu,
  X,
  Ticket,
  ShieldCheck,
  Heart,
  Globe,
  Instagram,
  MessageCircle,
  Video,
  Mail,
} from 'lucide-react';
import type { Profile } from '@/types/database';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ── Context for sidebar state ──────────────────────────────────────────
interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
  setCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

// Toggle this flag to show/hide the Personal 1-on-1 Classes in the student sidebar
const HIDE_ONE_ON_ONE = false;

// ── Nav config per role ────────────────────────────────────────────────
const navConfig = {
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
    ...(HIDE_ONE_ON_ONE ? [] : [{ label: 'Personal 1-on-1 Classes', icon: User, path: '/student/one-on-one' }]),
    { label: 'Live Group Sessions', icon: Users, path: '/student/group-session' },
    { label: 'Courses', icon: BookOpen, path: '/student/lms' },
    { label: 'Plans & Pricing', icon: CreditCard, path: '/student/plans' },
    { label: 'Consultation', icon: MessageCircle, path: '/student/consultation' },
    { label: 'Updates', icon: Megaphone, path: '/student/broadcasts' },
  ],
  instructor: [
    { label: 'Home', icon: LayoutDashboard, path: '/instructor/dashboard' },
    { label: 'Personal 1-on-1 Classes', icon: User, path: '/instructor/one-on-one' },
    { label: 'Live Group Sessions', icon: Users, path: '/instructor/groups' },
    { label: 'Broadcast Circulars', icon: Megaphone, path: '/instructor/broadcast' },
    { label: 'Course Library', icon: BookOpen, path: '/instructor/lms' },
  ],
  admin: [
    { label: 'Google Analytics', icon: Globe, path: '/admin?tab=google' },
    { label: 'Razorpay Analytics', icon: CreditCard, path: '/admin/razorpay-analytics' },
    { label: 'Meta Analytics', icon: Instagram, path: '/admin?tab=meta' },
    { label: 'Student Directory', icon: Users, path: '/admin?tab=students' },
  ],
  staff: [
    { label: 'Operations Hub', icon: LayoutDashboard, path: '/staff/dashboard' },
    { label: 'Personal 1-on-1 Classes', icon: User, path: '/staff/one-on-one' },
    { label: 'Consultation Queue', icon: MessageCircle, path: '/staff/consultations' },
    { label: 'Live Group Sessions', icon: Users, path: '/staff/groups' },
    { label: 'Notice Board', icon: Megaphone, path: '/staff/broadcast' },
    { label: 'Curriculum Library', icon: BookOpen, path: '/staff/lms' },
    { label: 'Discount Coupons', icon: Ticket, path: '/staff/coupons' },
    { label: 'Student Feedback', icon: Heart, path: '/staff/feedbacks' },
    { label: 'Webinar Link', icon: Video, path: '/staff/webinar' },
  ],
  client_management: [
    { label: 'Operations Hub', icon: LayoutDashboard, path: '/staff/dashboard' },
    { label: '1:1 Guidance Support', icon: User, path: '/staff/one-on-one' },
    { label: 'Consultation Queue', icon: MessageCircle, path: '/staff/consultations' },
    { label: 'Batch Operations', icon: Users, path: '/staff/groups' },
    { label: 'Notice Board', icon: Megaphone, path: '/staff/broadcast' },
    { label: 'Curriculum Library', icon: BookOpen, path: '/staff/lms' },
    { label: 'Discount Coupons', icon: Ticket, path: '/staff/coupons' },
    { label: 'Student Feedback', icon: Heart, path: '/staff/feedbacks' },
    { label: 'Webinar Link', icon: Video, path: '/staff/webinar' },
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
  isVerified?: boolean;
  children: React.ReactNode;
}

export function AppSidebar({
  user,
  activePlans = [],
  unreadNotificationsCount = 0,
  isVerified = true,
  children,
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Touch-swipe-to-close on mobile
  const touchStartX = useRef<number | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const links = navConfig[user.role as keyof typeof navConfig] ?? navConfig.student;

  const toggle = useCallback(() => setCollapsed((p) => !p), []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      
      // Clear server-side cookies
      await fetch('/auth/logout', { method: 'POST' }).catch(() => {});
      
      toast.success('Logged out', { description: 'You have successfully logged out.' });
      
      // Hard redirect to completely wipe Next.js client-side cache
      window.location.href = '/auth/login';
    } catch {
      toast.error('Logout failed', { description: 'An error occurred while logging out.' });
    }
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Swipe-left gesture to close drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 60) setMobileMenuOpen(false); // swipe left
    touchStartX.current = null;
  };

  const isAdmin = user.role === 'admin';

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, setCollapsed }}>
      <div className="flex h-[100dvh] overflow-hidden bg-[#FFFAF7] selection:bg-[#FF8A75]/20 selection:text-[#FF8A75] font-jakarta">

        {/* ── MOBILE HEADER ─────────────────────────────────────────── */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-3xl border-b border-[#FF8A75]/10 z-[70] flex items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#1a1a1a] text-white shadow-lg">
              <Flower2 className="h-4 w-4" />
            </div>
            <span className="text-lg font-sooner tracking-tight text-[#1a1a1a] leading-none">
              {isAdmin ? 'Intelligence' : 'Faceyoguez'}
            </span>
          </Link>
          <button
            id="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-[#FF8A75]/8 text-[#FF8A75] transition-all active:scale-95"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* ── MOBILE BACKDROP ───────────────────────────────────────── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onPointerDown={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
              }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[80] lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* ── SIDEBAR ───────────────────────────────────────────────── */}
        <aside
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            width: collapsed ? 72 : 272,
          }}
          className={cn(
            'fixed inset-y-0 left-0 z-[100] flex flex-col border-r',
            'transition-[width,transform] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]',
            isAdmin
              ? 'bg-[#0a0a0a] text-white border-white/[0.04]'
              : 'bg-white border-[#FF8A75]/8 text-slate-900 shadow-[4px_0_24px_-4px_rgba(255,138,117,0.06)]',
            // Mobile: slide in/out
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >

          {/* ── LOGO AREA ──────────────────────────────────────────── */}
          <div
            className={cn(
              'h-[72px] shrink-0 flex items-center border-b transition-all duration-500',
              isAdmin ? 'border-white/[0.04]' : 'border-[#FF8A75]/8',
              collapsed ? 'px-0 justify-center' : 'px-5 justify-between'
            )}
          >
            <Link
              href="/"
              className={cn(
                'flex items-center gap-3 group min-w-0',
                collapsed && 'justify-center'
              )}
            >
              <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-[#1a1a1a] text-white shadow-lg group-hover:scale-105 group-hover:rotate-6 transition-all duration-500">
                <Flower2 className="h-4 w-4" />
              </div>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    key="logo-text"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col overflow-hidden"
                  >
                    <span className={cn(
                      'text-base font-sooner tracking-tight leading-none whitespace-nowrap',
                      isAdmin ? 'text-white' : 'text-[#1a1a1a]'
                    )}>
                      {isAdmin ? 'Intelligence' : 'Faceyoguez'}
                    </span>
                    <span className={cn(
                      'text-[8px] font-black uppercase tracking-[0.35em] mt-1 opacity-50 whitespace-nowrap',
                      isAdmin ? 'text-slate-400' : 'text-[#FF8A75]'
                    )}>
                      {isAdmin ? 'Telemetry' : 'Face Yoga for Women'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>

            {/* Collapse toggle — desktop only */}
            {!collapsed && (
              <button
                id="sidebar-collapse-btn"
                aria-label="Collapse sidebar"
                onClick={toggle}
                className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:text-[#FF8A75] hover:bg-[#FF8A75]/5 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Expand button when collapsed — desktop only */}
          {collapsed && (
            <button
              id="sidebar-expand-btn"
              aria-label="Expand sidebar"
              onClick={toggle}
              className="hidden lg:flex h-10 w-10 mx-auto mt-3 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:text-[#FF8A75] hover:bg-[#FF8A75]/8 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {/* ── NAVIGATION ─────────────────────────────────────────── */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 custom-scrollbar">
            {!collapsed && user.role !== 'admin' && (
              <p className={cn(
                'px-5 mb-2 text-[9px] font-black uppercase tracking-[0.3em]',
                isAdmin ? 'text-slate-600' : 'text-slate-300'
              )}>
                Navigation
              </p>
            )}

            <ul className={cn('space-y-1', collapsed ? 'px-2' : 'px-3')}>
              {links.map(({ label, icon: Icon, path }) => {
                const isActive = pathname === path || pathname?.startsWith(path + '/');

                let requiresPlan: string | null = null;
                if (user.role === 'student') {
                  if (path.includes('one-on-one')) requiresPlan = 'one_on_one';
                  if (path.includes('group-session')) requiresPlan = 'group_session';
                }
                const isLocked = requiresPlan && !activePlans.includes(requiresPlan);

                return (
                  <li key={label} className="relative group/item">
                    <Link
                      href={isLocked ? '#' : path}
                      onClick={(e) => {
                        if (isLocked) e.preventDefault();
                        if (isAdmin) setCollapsed(true);
                      }}
                      className={cn(
                        // Base: full-width, flex center, min 44px touch target
                        'relative flex items-center rounded-2xl transition-all duration-300',
                        'min-h-[44px]',
                        collapsed
                          ? 'justify-center w-full h-12 px-0'
                          : 'gap-3 px-4 h-12',
                        isActive
                          ? isAdmin
                            ? 'bg-white/10 text-white ring-1 ring-white/10 shadow-lg'
                            : 'bg-[#FF8A75]/8 text-[#FF8A75] shadow-sm'
                          : isLocked
                            ? 'text-slate-400 cursor-not-allowed opacity-60'
                            : isAdmin
                              ? 'text-slate-400 hover:text-white hover:bg-white/5'
                              : 'text-slate-500 hover:text-[#FF8A75] hover:bg-[#FF8A75]/5'
                      )}
                    >
                      {/* Active left accent */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.span
                            layoutId={`active-nav-${user.role}`}
                            className={cn(
                              'absolute left-0 w-1 h-5 rounded-r-full',
                              isAdmin ? 'bg-white' : 'bg-[#FF8A75]'
                            )}
                            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                          />
                        )}
                      </AnimatePresence>

                      {/* Icon — always centered when collapsed */}
                      <span className={cn(
                        'shrink-0 flex items-center justify-center',
                        'h-9 w-9 rounded-xl transition-all duration-300',
                        collapsed ? 'mx-auto' : '',
                        isActive
                          ? isAdmin ? 'bg-white/8' : 'bg-[#FF8A75]/10'
                          : 'bg-transparent'
                      )}>
                        <Icon className={cn(
                          'transition-transform duration-200 group-hover/item:scale-110',
                          collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4'
                        )} />
                      </span>

                      {/* Label — hidden when collapsed */}
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            key="nav-label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
                          >
                            <span className="text-[13px] font-aktiv font-bold tracking-tight">{label}</span>
                            <span className="flex items-center gap-1.5 ml-2 shrink-0">
                              {isLocked && <ShieldCheck className="h-3 w-3 text-slate-300" />}
                              {label === 'Updates' && unreadNotificationsCount > 0 && (
                                <span className="flex h-4 min-w-[1.25rem] items-center justify-center rounded-full bg-[#FF8A75] text-white text-[9px] font-black px-1 shadow">
                                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                                </span>
                              )}
                            </span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>

                    {/* Tooltip when collapsed (desktop only) */}
                    {collapsed && (
                      <div
                        role="tooltip"
                        className={cn(
                          'pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[200]',
                          'px-3 py-1.5 rounded-xl text-xs font-aktiv font-bold whitespace-nowrap',
                          'opacity-0 translate-x-[-4px]',
                          'group-hover/item:opacity-100 group-hover/item:translate-x-0',
                          'transition-all duration-150 ease-out',
                          'hidden lg:block',
                          isAdmin
                            ? 'bg-white text-[#0a0a0a] shadow-lg'
                            : 'bg-[#1a1a1a] text-white shadow-xl shadow-slate-900/20'
                        )}
                      >
                        {label}
                        {/* Arrow */}
                        <span className={cn(
                          'absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent',
                          isAdmin ? 'border-r-white' : 'border-r-[#1a1a1a]'
                        )} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {!collapsed && user.role === 'student' && (
              <div className="mt-8 px-5 py-4 mx-3 rounded-2xl bg-[#FF8A75]/5 border border-[#FF8A75]/10 flex flex-col gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF8A75] block">Text Support</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://wa.me/917837310255"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-wider"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16">
                      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=management@faceyoguez.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-[#bc162d]/10 text-[#bc162d] hover:bg-[#bc162d] hover:text-white transition-all flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-wider"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Gmail
                  </a>
                </div>
              </div>
            )}
          </nav>

          {/* ── BOTTOM ACTIONS (Profile & Logout) ──────────────────────── */}
          <div className="shrink-0 pb-3">
            <ul className={cn('space-y-1', collapsed ? 'px-2' : 'px-3')}>
              {/* Profile Link */}
              <li className="relative group/item">
                <Link
                  href="/student/profile"
                  className={cn(
                    'relative flex items-center rounded-2xl transition-all duration-300',
                    'min-h-[44px]',
                    collapsed ? 'justify-center w-full h-12 px-0' : 'gap-3 px-4 h-12',
                    pathname === '/student/profile'
                      ? isAdmin ? 'bg-white/10 text-white ring-1 ring-white/10 shadow-lg' : 'bg-[#FF8A75]/8 text-[#FF8A75] shadow-sm'
                      : isAdmin ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-[#FF8A75] hover:bg-[#FF8A75]/5'
                  )}
                >
                  <span className={cn(
                    'shrink-0 flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-300 relative',
                    collapsed ? 'mx-auto' : '',
                    pathname === '/student/profile' ? (isAdmin ? 'bg-white/8' : 'bg-[#FF8A75]/10') : 'bg-transparent'
                  )}>
                    <UserCircle className={cn('transition-transform duration-200 group-hover/item:scale-110', collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4')} />
                    {!isVerified && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
                    )}
                  </span>
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
                      >
                        <span className="text-[13px] font-aktiv font-bold tracking-tight">{user.full_name}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
                {/* Tooltip */}
                {collapsed && (
                  <div className={cn(
                    'pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[200]',
                    'px-3 py-1.5 rounded-xl text-xs font-aktiv font-bold whitespace-nowrap opacity-0 translate-x-[-4px] group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-150 ease-out hidden lg:block',
                    isAdmin ? 'bg-white text-[#0a0a0a] shadow-lg' : 'bg-[#1a1a1a] text-white shadow-xl shadow-slate-900/20'
                  )}>
                    {user.full_name}
                    <span className={cn('absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent', isAdmin ? 'border-r-white' : 'border-r-[#1a1a1a]')} />
                  </div>
                )}
              </li>

              {/* Logout Button */}
              <li className="relative group/item">
                <button
                  onClick={handleLogout}
                  className={cn(
                    'w-full relative flex items-center rounded-2xl transition-all duration-300',
                    'min-h-[44px]',
                    collapsed ? 'justify-center w-full h-12 px-0' : 'gap-3 px-4 h-12',
                    isAdmin ? 'text-slate-400 hover:text-red-400 hover:bg-white/5' : 'text-slate-500 hover:text-red-500 hover:bg-red-50'
                  )}
                >
                  <span className={cn(
                    'shrink-0 flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-300',
                    collapsed ? 'mx-auto' : '',
                    'bg-transparent'
                  )}>
                    <LogOut className={cn('transition-transform duration-200 group-hover/item:scale-110', collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4')} />
                  </span>
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
                      >
                        <span className="text-[13px] font-aktiv font-bold tracking-tight">Log Out</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                {/* Tooltip */}
                {collapsed && (
                  <div className={cn(
                    'pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[200]',
                    'px-3 py-1.5 rounded-xl text-xs font-aktiv font-bold whitespace-nowrap opacity-0 translate-x-[-4px] group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-150 ease-out hidden lg:block',
                    isAdmin ? 'bg-white text-[#0a0a0a] shadow-lg' : 'bg-[#1a1a1a] text-white shadow-xl shadow-slate-900/20'
                  )}>
                    Log Out
                    <span className={cn('absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent', isAdmin ? 'border-r-white' : 'border-r-[#1a1a1a]')} />
                  </div>
                )}
              </li>
            </ul>
          </div>

        </aside>

        {/* ── MAIN CONTENT AREA ─────────────────────────────────────── */}
        <main
          className={cn(
            'flex-1 overflow-y-auto h-full relative z-0 pt-16 lg:pt-0',
            'transition-[margin-left] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]',
            // Mobile: sidebar is overlay → no margin. Desktop: shift by sidebar width
            collapsed ? 'lg:ml-[72px]' : 'lg:ml-[272px]'
          )}
        >
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
