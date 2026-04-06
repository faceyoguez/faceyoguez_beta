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
  LogOut,
  ChevronLeft,
  ChevronRight,
  Flower2,
  CreditCard,
  Menu,
  X,
  Ticket,
  ShieldCheck,
} from 'lucide-react';
import type { Profile } from '@/types/database';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ── Context for sidebar state ──
const SidebarContext = createContext({ collapsed: false, toggle: () => { } });
export const useSidebar = () => useContext(SidebarContext);

// ── Nav config per role ──
const navConfig = {
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
    { label: 'One-on-One', icon: User, path: '/student/one-on-one' },
    { label: 'Group Classes', icon: Users, path: '/student/group-session' },
    { label: 'Courses', icon: BookOpen, path: '/student/lms' },
    { label: 'Plans & Pricing', icon: CreditCard, path: '/student/plans' },
    { label: 'Updates', icon: Megaphone, path: '/student/broadcasts' },
  ],
  instructor: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/instructor/dashboard' },
    { label: 'One-on-One', icon: User, path: '/instructor/one-on-one' },
    { label: 'Group Classes', icon: Users, path: '/instructor/groups' },
    { label: 'Broadcast', icon: Megaphone, path: '/instructor/broadcast' },
    { label: 'Courses', icon: BookOpen, path: '/instructor/lms' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
    { label: 'One-on-One', icon: User, path: '/staff/one-on-one' },
    { label: 'Groups', icon: Users, path: '/staff/groups' },
    { label: 'Broadcast', icon: Megaphone, path: '/staff/broadcast' },
    { label: 'Courses', icon: BookOpen, path: '/staff/lms' },
    { label: 'Coupons', icon: Ticket, path: '/staff/coupons' },
  ],
  staff: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
    { label: 'One-on-One', icon: User, path: '/staff/one-on-one' },
    { label: 'Groups', icon: Users, path: '/staff/groups' },
    { label: 'Broadcast', icon: Megaphone, path: '/staff/broadcast' },
    { label: 'Courses', icon: BookOpen, path: '/staff/lms' },
    { label: 'Coupons', icon: Ticket, path: '/staff/coupons' },
  ],
  client_management: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
    { label: 'One-on-One', icon: User, path: '/staff/one-on-one' },
    { label: 'Groups', icon: Users, path: '/staff/groups' },
    { label: 'Broadcast', icon: Megaphone, path: '/staff/broadcast' },
    { label: 'Courses', icon: BookOpen, path: '/staff/lms' },
    { label: 'Coupons', icon: Ticket, path: '/staff/coupons' },
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

export function AppSidebar({
  user,
  activePlans = [],
  unreadNotificationsCount = 0,
  children
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const links = navConfig[user.role as keyof typeof navConfig] || navConfig.student;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed((p) => !p) }}>
      <div className="flex h-[100dvh] overflow-hidden bg-[#FFFAF7] selection:bg-[#FF8A75]/20 selection:text-[#FF8A75] font-sans">
        
        {/* MOBILE HEADER */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white/60 backdrop-blur-3xl border-b border-[#FF8A75]/10 z-[70] flex items-center justify-between px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-[#1a1a1a] text-white shadow-xl">
              <Flower2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-serif tracking-tight text-[#1a1a1a] leading-none">
              Faceyoguez
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#FF8A75]/5 text-[#FF8A75] transition-all"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* MOBILE OVERLAY */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-xl z-[80] lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* ── SIDEBAR ── */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-[100] flex flex-col bg-white border-r border-[#FF8A75]/5 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl shadow-[#FF8A75]/5",
            collapsed ? 'w-24 hidden lg:flex' : 'w-80 lg:flex',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          {/* LOGO AREA */}
          <div className="h-32 px-10 flex items-center justify-between shrink-0 mb-4">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="h-12 w-12 flex items-center justify-center rounded-[1.2rem] bg-[#1a1a1a] text-white shadow-2xl shadow-[#1a1a1a]/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Flower2 className="h-6 w-6" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-2xl font-serif tracking-tight text-[#1a1a1a] leading-none">
                    Faceyoguez
                  </span>
                  <span className="text-[7px] font-black uppercase tracking-[0.4em] text-[#FF8A75] mt-1.5 opacity-60">Face Yoga for Women</span>
                </div>
              )}
            </Link>
            
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex h-8 w-8 items-center justify-center text-slate-300 hover:text-[#FF8A75] transition-colors"
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          {/* MAIN NAV */}
          <nav className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
             {!collapsed && (
               <p className="px-6 mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                 Navigation
               </p>
             )}
             
             <ul className="space-y-3">
                {links.map(({ label, icon: Icon, path }) => {
                  const isActive = pathname === path || pathname?.startsWith(path + '/');
                  
                  let requiresPlan: string | null = null;
                  if (user.role === 'student') {
                    if (path.includes('one-on-one')) requiresPlan = 'one_on_one';
                    if (path.includes('group-session')) requiresPlan = 'group_session';
                  }
                  const isLocked = requiresPlan && !activePlans.includes(requiresPlan);

                  return (
                    <li key={label}>
                      <Link
                        href={isLocked ? '#' : path}
                        onClick={(e) => { if (isLocked) e.preventDefault(); }}
                        className={cn(
                          "group relative flex items-center h-16 rounded-[1.5rem] px-6 transition-all duration-500",
                          isActive 
                            ? "bg-white shadow-xl shadow-[#FF8A75]/10 text-[#FF8A75] ring-1 ring-[#FF8A75]/5" 
                            : isLocked 
                              ? "text-slate-200 cursor-not-allowed" 
                              : "text-slate-400 hover:text-[#FF8A75] hover:bg-[#FFFAF7]"
                        )}
                      >
                        {/* Active Indicator Glow */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div 
                              layoutId="active-nav"
                              className="absolute left-0 w-1.5 h-6 bg-[#FF8A75] rounded-r-full"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                        </AnimatePresence>

                        <div className={cn(
                          "flex items-center justify-center h-10 w-10 shrink-0 transition-all duration-500 rounded-xl",
                          isActive ? "bg-[#FF8A75]/5" : "bg-transparent"
                        )}>
                          <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-[#FF8A75]" : "text-current")} />
                        </div>

                        {!collapsed && (
                          <div className="ml-4 flex-1 flex items-center justify-between">
                            <span className="text-[13px] font-bold tracking-tight">{label}</span>
                            {isLocked && <ShieldCheck className="h-3 w-3 text-slate-100" />}
                            {label === 'Updates' && unreadNotificationsCount > 0 && (
                               <span className="flex h-5 w-8 items-center justify-center rounded-full bg-[#FF8A75] text-white text-[9px] font-black shadow-lg">
                                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                               </span>
                            )}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
             </ul>
          </nav>

          {/* USER FOOTER AREA */}
          <div className="shrink-0 p-6 border-t border-[#FF8A75]/5">
            <div className={cn(
              "flex items-center gap-4 p-4 rounded-[1.8rem] bg-[#FFFAF7] border border-[#FF8A75]/10 shadow-sm transition-all hover:bg-white",
              collapsed ? 'justify-center' : ''
            )}>
               <div className="relative shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} className="h-10 w-10 rounded-2xl object-cover ring-2 ring-white shadow-sm" />
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-[#FF8A75]/5 text-[#FF8A75] font-black text-sm">
                      {user.full_name?.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
               </div>

               {!collapsed && (
                 <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-black text-[#1a1a1a]">{user.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#FF8A75]/60 truncate">
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                 </div>
               )}

               {!collapsed && (
                 <form action="/auth/logout" method="post">
                   <button type="submit" className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all">
                     <LogOut className="h-4 w-4" />
                   </button>
                 </form>
               )}
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT CANVAS ── */}
        <main
          className={cn(
            "flex-1 overflow-y-auto h-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] pt-20 lg:pt-0 pb-12 relative z-0",
            collapsed ? 'lg:ml-24' : 'lg:ml-80'
          )}
        >
          {children}
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,138,117,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,138,117,0.2); }
      `}</style>
    </SidebarContext.Provider>
  );
}
