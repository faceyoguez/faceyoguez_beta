'use client';

import {
    Bell, Megaphone, ShieldCheck, Download, Sparkles, Clock, Calendar, CheckCircle2,
    ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { markNotificationAsRead } from '@/lib/actions/broadcast';
import { cn } from '@/lib/utils';
import { PlanExpiryPill } from '@/components/ui/plan-expiry-pill';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';

interface StudentBroadcastClientProps {
    notifications: any[];
    subscriptionStartDate?: string | null;
}

export function StudentBroadcastClient({ notifications, subscriptionStartDate }: StudentBroadcastClientProps) {

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const totalPages = Math.ceil(notifications.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedNotifications = notifications.slice(startIndex, startIndex + itemsPerPage);

    // Group paginated notifications by date
    const groupedNotifications = paginatedNotifications.reduce((groups: any, notif) => {
        const date = new Date(notif.created_at);
        let label = 'Earlier';
        if (isToday(date)) label = 'Today';
        else if (isYesterday(date)) label = 'Yesterday';
        else label = format(date, 'MMMM d, yyyy');

        if (!groups[label]) groups[label] = [];
        groups[label].push(notif);
        return groups;
    }, {});

    return (
        <div className="min-h-full font-jakarta bg-[#FDFCFB]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
                
                {subscriptionStartDate && (
                    <div className="flex justify-center">
                        <PlanExpiryPill 
                            subscriptionStartDate={subscriptionStartDate} 
                            planName="Broadcast Access"
                        />
                    </div>
                )}

                <header className="text-center space-y-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF8A75]/10 border border-[#FF8A75]/20 text-[#FF8A75] text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        <Megaphone className="w-3.5 h-3.5" />
                        Live Announcements
                    </motion.div>
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-5xl font-aktiv font-bold text-slate-900 tracking-tight leading-tight">
                            The Inner <span className="text-[#FF8A75]">Circle</span>
                        </h1>
                        <p className="text-sm sm:text-base text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                            Stay connected with direct updates, wisdom, and technical guidance from your sanctuary instructors.
                        </p>
                    </div>
                </header>

                <main className="relative">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-0 sm:left-1/2 top-0 bottom-0 w-px bg-slate-100 hidden sm:block" />

                    {notifications.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-24 px-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm text-center"
                        >
                            <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-8 relative">
                                <Sparkles className="h-10 w-10 text-[#FF8A75]/20" />
                                <div className="absolute inset-0 bg-[#FF8A75]/5 rounded-3xl animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-aktiv font-bold text-slate-900">Quiet in the Sanctuary</h3>
                            <p className="mt-2 text-sm text-slate-400 font-medium max-w-xs leading-relaxed">
                                No new announcements have been shared yet. You'll be notified as soon as wisdom flows your way.
                            </p>
                        </motion.div>
                    ) : (
                        <div className="space-y-16">
                            {Object.entries(groupedNotifications).map(([label, group]: [string, any], groupIdx) => (
                                <section key={label} className="space-y-8 relative">
                                    {/* Date Header */}
                                    <div className="flex justify-start sm:justify-center sticky top-24 z-20">
                                        <span className="px-6 py-2 rounded-full bg-white border border-slate-100 shadow-sm text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            {label}
                                        </span>
                                    </div>

                                    <div className="space-y-8">
                                        {group.map((notif: any, idx: number) => {
                                            const broadcast = notif.broadcasts || {};
                                            const instructor = broadcast.sender || {};
                                            const isEven = idx % 2 === 0;

                                            return (
                                                <motion.div
                                                    key={notif.id}
                                                    initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    viewport={{ once: true }}
                                                    onClick={() => !notif.is_read && markNotificationAsRead(notif.id)}
                                                    className={cn(
                                                        "group relative w-full sm:w-[calc(50%-1.5rem)] flex flex-col gap-4 transition-all duration-500",
                                                        isEven ? "sm:mr-auto text-left" : "sm:ml-auto text-left sm:items-end"
                                                    )}
                                                >
                                                    {/* Timeline Dot */}
                                                    <div className={cn(
                                                        "absolute top-8 hidden sm:flex h-4 w-4 rounded-full border-4 border-[#FDFCFB] z-30 transition-transform duration-500 group-hover:scale-125",
                                                        isEven ? "-right-[1.85rem] bg-slate-200" : "-left-[1.85rem] bg-slate-200",
                                                        !notif.is_read && "bg-[#FF8A75] shadow-[0_0_12px_rgba(255,138,117,0.5)]"
                                                    )} />

                                                    {/* Announcement Card */}
                                                    <div className={cn(
                                                        "w-full rounded-[2rem] bg-white border p-6 sm:p-8 transition-all duration-500 relative overflow-hidden",
                                                        notif.is_read 
                                                            ? "border-slate-100 shadow-sm opacity-80" 
                                                            : "border-[#FF8A75]/10 shadow-xl shadow-[#FF8A75]/5 cursor-pointer ring-1 ring-[#FF8A75]/5"
                                                    )}>
                                                        {/* Header: Instructor info */}
                                                        <div className="flex items-center gap-4 mb-6">
                                                            <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-slate-50 shrink-0 shadow-sm">
                                                                {instructor.avatar_url ? (
                                                                    <img src={instructor.avatar_url} alt="" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-300 bg-slate-50">
                                                                        {(instructor.full_name || 'I').charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 truncate">
                                                                    {instructor.full_name || 'Sanctuary Guide'}
                                                                </h4>
                                                                <div className="flex items-center gap-1.5 text-[8px] font-black text-[#FF8A75] uppercase tracking-[0.2em] mt-0.5">
                                                                    <ShieldCheck className="h-2.5 w-2.5" /> Certified
                                                                </div>
                                                            </div>
                                                            {!notif.is_read && (
                                                                <div className="ml-auto flex items-center gap-2 px-2 py-1 rounded-md bg-[#FF8A75]/10 text-[#FF8A75] text-[8px] font-black uppercase tracking-widest">
                                                                    <span className="w-1 h-1 rounded-full bg-[#FF8A75] animate-pulse" />
                                                                    New Update
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="space-y-4">
                                                            <h3 className="text-xl sm:text-2xl font-aktiv font-bold text-slate-900 leading-tight">
                                                                {notif.title}
                                                            </h3>
                                                            <p className="text-sm leading-relaxed text-slate-500 font-medium font-jakarta whitespace-pre-wrap line-clamp-6 group-hover:line-clamp-none transition-all duration-700">
                                                                {notif.message}
                                                            </p>
                                                        </div>

                                                        {/* Attachments */}
                                                        {broadcast.file_url && (
                                                            <div className="mt-8 pt-6 border-t border-slate-50">
                                                                <a
                                                                    href={broadcast.file_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="group/btn flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#FF8A75]/20 hover:bg-white transition-all duration-300"
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#FF8A75] border border-slate-100 group-hover/btn:scale-110 transition-transform">
                                                                            <Download className="h-4 w-4" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-900">{broadcast.file_name || 'Download Resource'}</p>
                                                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Official Material</p>
                                                                        </div>
                                                                    </div>
                                                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover/btn:text-[#FF8A75] group-hover/btn:translate-x-1 transition-all" />
                                                                </a>
                                                            </div>
                                                        )}

                                                        {/* Footer: Meta */}
                                                        <div className="mt-6 flex items-center gap-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-3 h-3" />
                                                                {format(new Date(notif.created_at), 'h:mm a')}
                                                            </div>
                                                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                            {notif.is_read && (
                                                                <div className="flex items-center gap-1 text-emerald-500/50">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    Read
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </main>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8 border-t border-slate-100"
                    >
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setCurrentPage(prev => Math.max(1, prev - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={currentPage === 1}
                                className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#FF8A75] hover:border-[#FF8A75]/20 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            
                            <div className="flex items-center gap-1 px-2">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Show first, last, and pages around current
                                    if (
                                        pageNum === 1 || 
                                        pageNum === totalPages || 
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => {
                                                    setCurrentPage(pageNum);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className={cn(
                                                    "h-12 w-12 rounded-2xl text-[11px] font-black transition-all",
                                                    currentPage === pageNum 
                                                        ? "bg-[#FF8A75] text-white shadow-lg shadow-[#FF8A75]/20" 
                                                        : "bg-white text-slate-400 border border-slate-100 hover:border-[#FF8A75]/20 hover:text-[#FF8A75]"
                                                )}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    }
                                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                        return <span key={pageNum} className="px-1 text-slate-300">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                onClick={() => {
                                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={currentPage === totalPages}
                                className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#FF8A75] hover:border-[#FF8A75]/20 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                            Page {currentPage} of {totalPages}
                        </p>
                    </motion.div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}
