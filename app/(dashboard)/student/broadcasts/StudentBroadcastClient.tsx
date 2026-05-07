'use client';

import {
    Bell, Megaphone, ShieldCheck, Download, Sparkles
} from 'lucide-react';
import { markNotificationAsRead } from '@/lib/actions/broadcast';
import { cn } from '@/lib/utils';
import { PlanExpiryPill } from '@/components/ui/plan-expiry-pill';

interface StudentBroadcastClientProps {
    notifications: any[];
    subscriptionStartDate?: string | null;
}

export function StudentBroadcastClient({ notifications, subscriptionStartDate }: StudentBroadcastClientProps) {

    return (
        <div className="min-h-full font-jakarta p-4 sm:p-6 lg:p-8 space-y-5">
            {subscriptionStartDate && (
                <PlanExpiryPill 
                    subscriptionStartDate={subscriptionStartDate} 
                    planName="Updates & Announcements"
                />
            )}

            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-aktiv font-bold text-[#1a1a1a] tracking-tight">
                        Instructor <span className="text-[#FF8A75]">Updates</span>
                    </h1>
                    <p className="text-xs text-slate-400 font-medium mt-1">Announcements from your instructors</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#FF8A75]/10 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-[#FF8A75]" />
                </div>
            </header>

            <main>
                {notifications.length === 0 ? (
                    <div className="flex h-[360px] flex-col items-center justify-center rounded-[1.75rem] bg-white border border-slate-100 shadow-sm">
                        <Sparkles className="mb-6 h-16 w-16 text-primary/10 animate-pulse" />
                        <h3 className="text-xl font-aktiv font-bold text-foreground">No Announcements Yet</h3>
                        <p className="mt-2 text-sm text-foreground/40 font-medium">No new announcements yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {notifications.map((notif) => {
                            const broadcast = notif.broadcasts || {};
                            const instructor = broadcast.sender || {};

                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => {
                                        if (!notif.is_read) {
                                            markNotificationAsRead(notif.id);
                                        }
                                    }}
                                    className={cn(
                                        "group relative flex flex-col rounded-[1.75rem] border transition-all duration-300 overflow-hidden bg-white",
                                        notif.is_read 
                                            ? "border-slate-100 opacity-75 cursor-default" 
                                            : "border-[#FF8A75]/20 cursor-pointer shadow-md hover:shadow-lg hover:shadow-[#FF8A75]/5"
                                    )}
                                >
                                    {!notif.is_read && (
                                        <div className="absolute top-8 right-8 h-3 w-3 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--brand-primary),0.5)] animate-pulse" />
                                    )}

                                    <div className="p-8 pb-0">
                                        <div className="flex items-center justify-between gap-6 mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl overflow-hidden border border-outline-variant/10 shadow-sm bg-white shrink-0">
                                                    {instructor.avatar_url ? (
                                                        <img src={instructor.avatar_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-[10px] font-black uppercase text-foreground/20">
                                                            {(instructor.full_name || 'I').charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-black uppercase tracking-tight text-foreground">{instructor.full_name || 'Guide'}</h4>
                                                    <div className="flex items-center gap-1.5 text-[8px] font-black text-primary uppercase tracking-widest mt-0.5">
                                                        <ShieldCheck className="h-2.5 w-2.5" /> Certified Instructor
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.2em]">
                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                </p>
                                                <p className="text-[9px] font-black text-foreground/10 uppercase tracking-[0.2em] mt-1">
                                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <h3 className="text-xl font-aktiv font-bold text-foreground leading-tight">"{notif.title}"</h3>
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/60 font-medium font-jakarta">
                                                {notif.message}
                                            </p>
                                        </div>
                                    </div>

                                    {broadcast.file_url && (
                                        <div className="mt-auto border-t border-outline-variant/5 px-8 py-6 bg-foreground/2 group-hover:bg-foreground/5 transition-colors">
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-outline-variant/5 flex items-center justify-center text-primary">
                                                        <Download className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-[10px] font-black uppercase tracking-tight text-foreground">{broadcast.file_name || 'Attachment'}</p>
                                                        <p className="text-[8px] font-black text-foreground/20 uppercase tracking-widest mt-0.5">Tap to open</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={broadcast.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="h-10 px-6 rounded-full bg-foreground text-background text-[9px] font-black uppercase tracking-[0.2em] flex items-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                                                >
                                                    Open
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {!broadcast.file_url && <div className="mt-auto h-4 w-full bg-gradient-to-r from-primary/5 via-transparent to-transparent" />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

        </div>
    );
}
