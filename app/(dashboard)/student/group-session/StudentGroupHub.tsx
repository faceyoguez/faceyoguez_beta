'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { JourneyProgress } from '@/components/ui/journey-progress';
import {
    Calendar, Users, Star,
    Flame, PlayCircle, FileText, Download, CheckCircle, Send,
    Video, Clock, Sparkles, ChevronRight, Play, ShieldCheck, MessageSquare, X,
    ArrowUpRight
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '../../../../lib/supabase/client';
import { getBatchMessages, sendBatchMessage } from '../../../../lib/actions/chat';
import { getBatchPollsMap, getPollById, votePoll } from '../../../../lib/actions/polls';
import { getJourneyLogs, saveDailyCheckIn, type JourneyLog } from '../../../../lib/actions/journey';
import { getUpcomingMeetingsForStudent, getBatchRecordedSessions } from '../../../../lib/actions/meetings';
import { AnglePhotoTracker } from '../../../../components/ui/angle-photo-tracker';
import { PlanExpiryPill } from '../../../../components/ui/plan-expiry-pill';
import { PollCard } from '../../../../components/ui/poll-card';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

import type { Profile, MeetingWithDetails, BatchPoll, RecordedSession } from '../../../../types/database';

interface StudentGroupClientProps {
    currentUser: Profile;
    activeBatch: {
        id: string;
        name: string;
        start_date: string;
        end_date?: string | null;
        is_chat_enabled: boolean;
        instructor_id?: string | null;
        enrollment_count?: number | null;
        instructor?: {
            id: string;
            full_name: string;
            avatar_url: string | null;
        } | null;
    } | null;
    initialResources: { id: string; file_url: string; title?: string; file_name: string }[];
    isTrialAccess?: boolean;
    trialEndDate?: string | null;
    subscriptionStartDate?: string | null;
}

const JOURNEY_MAX_DAY = 365;

export function StudentGroupHub({ currentUser, activeBatch, initialResources, isTrialAccess = false, trialEndDate, subscriptionStartDate }: StudentGroupClientProps) {
    const isChatEnabled = activeBatch?.is_chat_enabled ?? true;
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = useMemo(() => createClient(), []);

    const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingWithDetails[]>([]);
    const [recordings, setRecordings] = useState<RecordedSession[]>([]);
    const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
    const [polls, setPolls] = useState<Record<string, BatchPoll>>({});
    const [votingPollId, setVotingPollId] = useState<string | null>(null);
    const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
    const [activeStepDay, setActiveStepDay] = useState<number>(1);
    const [notesInput, setNotesInput] = useState('');
    const [isSavingLog, setIsSavingLog] = useState(false);

    const activeLog = journeyLogs.find((l: JourneyLog) => l.day_number === activeStepDay);
    const day1Log   = journeyLogs.find((l: JourneyLog) => l.day_number === 1);

    const currentDay = React.useMemo(() => {
        const anchorDateStr = activeBatch?.start_date || subscriptionStartDate;
        if (!anchorDateStr) return 1;

        const startDate = new Date(anchorDateStr);
        const now = new Date();
        const diffTime = now.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return Math.min(JOURNEY_MAX_DAY, Math.max(1, diffDays));
    }, [subscriptionStartDate, activeBatch?.start_date]);

    const currentMonth = Math.ceil(currentDay / 30);
    const currentDayInMonth = ((currentDay - 1) % 30) + 1;

    useEffect(() => {
        setActiveStepDay(currentDay);
    }, [currentDay]);

    useEffect(() => {
        if (!activeBatch?.id) return;

        const init = async () => {
            setIsLoadingRecordings(true);
            const [msgs, pollsMap, logs, meetingsData, recs] = await Promise.all([
                getBatchMessages(activeBatch.id),
                getBatchPollsMap(activeBatch.id, currentUser.id),
                getJourneyLogs(currentUser.id),
                getUpcomingMeetingsForStudent(),
                getBatchRecordedSessions(activeBatch.id, activeBatch.end_date ?? ''),
            ]);
            setMessages(msgs);
            setPolls(pollsMap);
            setRecordings(recs);
            setIsLoadingRecordings(false);
            setJourneyLogs(logs);
            setUpcomingMeetings(meetingsData || []);
        };
        init();

        const msgChannel = supabase
            .channel(`batch-chat-${activeBatch.id}-${Math.random().toString(36).slice(2, 9)}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'batch_messages',
                    filter: `batch_id=eq.${activeBatch.id}`
                },
                async (payload: { new: { sender_id: string; message_type?: string; poll_id?: string } }) => {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, role')
                        .eq('id', payload.new.sender_id)
                        .single();
                    setMessages((prev: any[]) => [...prev, { ...payload.new, sender: profile }]);

                    if (payload.new.message_type === 'poll' && payload.new.poll_id) {
                        const pollData = await getPollById(payload.new.poll_id, currentUser.id);
                        if (pollData) setPolls((prev: Record<string, BatchPoll>) => ({ ...prev, [pollData.id]: pollData }));
                    }
                }
            )
            .subscribe();

        const voteChannel = supabase
            .channel(`student-votes-${activeBatch.id}-${Math.random().toString(36).slice(2, 9)}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'batch_poll_votes' },
                async (payload: { new?: { poll_id?: string } }) => {
                    const pollId = payload.new?.poll_id;
                    if (!pollId) return;
                    const updated = await getPollById(pollId, currentUser.id);
                    if (updated) setPolls((prev: Record<string, BatchPoll>) => ({ ...prev, [pollId]: updated }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(msgChannel);
            supabase.removeChannel(voteChannel);
        };
    }, [activeBatch?.id, currentUser.id, supabase]);

    const router = useRouter();

    useEffect(() => {
        const subChannel = supabase
            .channel('student-group-subscriptions')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'subscriptions',
                    filter: `student_id=eq.${currentUser.id}`
                },
                () => {
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subChannel);
        };
    }, [supabase, currentUser.id, router]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (isChatOpen) {
            setUnreadCount(0);
        }
    }, [isChatOpen]);

    useEffect(() => {
        if (!isChatOpen && messages.length > 0) {
            setUnreadCount((prev: number) => prev + 1);
        }
    }, [messages]);

    useEffect(() => {
        setNotesInput(activeLog?.notes || '');
    }, [activeStepDay, activeLog]);

    const handleVotePoll = async (pollId: string, optionId: string) => {
        setVotingPollId(pollId);
        const res = await votePoll(pollId, optionId);
        if (res.success) {
            const updated = await getPollById(pollId, currentUser.id);
            if (updated) setPolls((prev: Record<string, BatchPoll>) => ({ ...prev, [pollId]: updated }));
        }
        setVotingPollId(null);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeBatch?.id) return;
        try {
            const res = await sendBatchMessage(activeBatch.id, newMessage.trim(), currentUser.id);
            if (res.success) {
                setNewMessage('');
            }
        } catch (err: any) {
            console.error("SEND ERROR:", err);
        }
    };

    const handleSavePhotos = async (photos: { front?: { base64: string; mimeType: string }; left?: { base64: string; mimeType: string }; right?: { base64: string; mimeType: string } }) => {
        setIsSavingLog(true);
        const { success, data } = await saveDailyCheckIn(currentUser.id, activeStepDay, null, null, null, photos);
        if (success && data) {
            setJourneyLogs((prev: JourneyLog[]) => [...prev.filter((l: JourneyLog) => l.day_number !== activeStepDay), data]);
        }
        setIsSavingLog(false);
    };

    const nextBatchMeeting = upcomingMeetings.find((m: MeetingWithDetails) => m.batch_id === activeBatch?.id);
    const [isJoinEnabled, setIsJoinEnabled] = useState(false);

    useEffect(() => {
        if (!nextBatchMeeting) return;
        const checkTime = () => {
            const meetingTime = new Date(nextBatchMeeting.start_time).getTime();
            const now = Date.now();
            setIsJoinEnabled(meetingTime - now <= 300000);
        };
        checkTime();
        const interval = setInterval(checkTime, 10000);
        return () => clearInterval(interval);
    }, [nextBatchMeeting]);

    const chatContent = (
        <div className="h-full flex flex-col overflow-hidden bg-white/50 backdrop-blur-xl">
            <div className="p-6 sm:p-8 border-b border-outline-variant/5 flex flex-col gap-1.5 shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Group Chat</h3>
                    <div className="h-2 w-2 rounded-full bg-primary/40" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Live Group Chat</p>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                {messages.map((msg: any) => {
                    const sender = msg.sender || msg.profiles || msg.senderProfile || {};
                    const isOwn = msg.sender_id === currentUser.id;
                    const isPoll = msg.message_type === 'poll';
                    const poll = isPoll ? polls[msg.poll_id] : null;

                    const roles: Record<string, string> = {
                        admin: 'Admin',
                        instructor: 'Instructor',
                        staff: 'Staff',
                        client_management: 'Staff'
                    };

                    const roleLabel = roles[sender.role] || (msg.sender_id === activeBatch?.instructor_id ? 'Instructor' : null);

                    return (
                        <div key={msg.id} className={cn("flex flex-col gap-1.5", isOwn ? "items-end" : "items-start")}>
                            {!isOwn && (
                                <div className="flex items-center gap-2 mb-0.5">
                                    <div className="h-6 w-6 rounded-lg overflow-hidden border border-outline-variant/10 bg-white">
                                        {sender.avatar_url ? <img src={sender.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-foreground/20 bg-foreground/5">{(sender.full_name || 'U').charAt(0).toUpperCase()}</div>}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">{sender.full_name}</p>
                                            {msg.sender_id === (activeBatch?.instructor_id || activeBatch?.instructor?.id) && <ShieldCheck className="w-3 h-3 text-primary/60" />}
                                        </div>
                                        {roleLabel && (
                                            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-primary/40 leading-none">{roleLabel}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isPoll ? (
                                poll && <div className="w-full"><PollCard poll={poll} isAdmin={false} onVote={(id: string) => handleVotePoll(poll.id, id)} isVoting={votingPollId === poll.id} /></div>
                            ) : (
                                <div className={cn(
                                    "max-w-[90%] px-4 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed border shadow-sm",
                                    isOwn
                                        ? "bg-foreground text-background border-foreground rounded-tr-none"
                                        : "bg-white border-outline-variant/5 text-foreground/70 rounded-tl-none"
                                )}>
                                    {msg.content}
                                </div>
                            )}
                            <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest mt-0.5">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    );
                })}
            </div>

            <div className="p-6 sm:p-8 border-t border-outline-variant/10 bg-white/40 backdrop-blur-md shrink-0 mb-safe">
                {isChatEnabled ? (
                    <div className="relative group">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="w-full h-12 pl-5 pr-12 rounded-xl bg-white border border-outline-variant/10 text-[13px] text-foreground font-medium placeholder:text-foreground/20 focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all shadow-sm group-hover:border-primary/20"
                        />
                        <button onClick={handleSendMessage} className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="h-12 rounded-xl bg-foreground/5 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-foreground/20">Chat it turned off</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-full font-jakarta px-4 sm:px-8 lg:px-12 py-8 space-y-8 max-w-[1920px] mx-auto">
            {subscriptionStartDate && (
                <PlanExpiryPill 
                    subscriptionStartDate={subscriptionStartDate} 
                    planName={activeBatch?.name || "Group Classes"}
                />
            )}

            {isTrialAccess && (
                <div className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    <Sparkles className="w-3 h-3 text-[#e76f51]" />
                    Trial Access Active: {trialEndDate && <span>{new Date(trialEndDate).toLocaleDateString()}</span>}
                </div>
            )}

            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900 tracking-tight">
                        Group <span className="text-[#e76f51]">Hub</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-[#e76f51] uppercase tracking-widest">{activeBatch?.name || 'Loading Batch...'}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeBatch?.enrollment_count || 0} Members</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#e76f51]/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#e76f51]" />
                    </div>
                    <button 
                        onClick={() => setIsChatOpen(true)}
                        className="xl:hidden h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm relative"
                    >
                        <MessageSquare className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#e76f51] text-white text-[8px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ── LEFT RAIL: Batch Meta ── */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {/* Batch Overview Card */}
                    <div className="p-6 rounded-[2rem] bg-slate-900 text-white shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Sparkles className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#e76f51]">Your Batch</p>
                                <h3 className="text-xl font-bold tracking-tight leading-tight">{activeBatch?.name || 'Sanctuary Batch'}</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Members</p>
                                    <p className="text-lg font-bold">{activeBatch?.enrollment_count || 0}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Streak</p>
                                    <div className="flex items-center gap-1.5">
                                        <Flame className="w-4 h-4 text-[#e76f51]" />
                                        <p className="text-lg font-bold">{currentDay}d</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Instructor Card */}
                    <div className="p-5 rounded-[1.75rem] border border-slate-100 bg-white shadow-sm flex items-center gap-4 group hover:border-[#e76f51]/20 transition-all">
                        <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-slate-50 shrink-0 group-hover:scale-105 transition-transform">
                            {activeBatch?.instructor?.avatar_url ? (
                                <img src={activeBatch.instructor.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-300 bg-slate-50">{(activeBatch?.instructor?.full_name || 'I').charAt(0).toUpperCase()}</div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Guided By</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{activeBatch?.instructor?.full_name || 'Instructor Name'}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Now</span>
                            </div>
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="p-6 rounded-[1.75rem] border border-slate-100 bg-white shadow-sm flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[#e76f51]" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900">Resources</h3>
                            </div>
                            <FileText className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                            {initialResources.length > 0 ? (
                                initialResources.map((res: { id: string; file_url: string; title?: string; file_name: string }) => (
                                    <button key={res.id} onClick={() => window.open(res.file_url, '_blank')} className="w-full flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-100/50 rounded-xl hover:border-[#e76f51]/20 hover:bg-white hover:shadow-sm transition-all text-left group">
                                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-[#e76f51] transition-colors">
                                            <Download className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-slate-700 truncate">{res.title || res.file_name}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">PDF Document</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="py-10 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                                    <FileText className="w-6 h-6 text-slate-200 mx-auto" />
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">No resources yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recordings Suite */}
                    <div className="p-6 rounded-[1.75rem] border border-slate-100 bg-white shadow-sm flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900">Recordings</h3>
                            </div>
                            <PlayCircle className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                            {recordings.map((rec: RecordedSession) => (
                                <button key={rec.id} onClick={() => rec.is_available && window.open(rec.play_url!, '_blank')} className="w-full flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-100/50 rounded-xl hover:border-[#e76f51]/20 hover:bg-white hover:shadow-sm transition-all text-left group">
                                    <div className="h-10 w-16 rounded-lg bg-slate-200/50 overflow-hidden relative shrink-0">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {rec.is_available ? (
                                                <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#e76f51] group-hover:scale-110 transition-all fill-current" />
                                            ) : (
                                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-slate-700 truncate">{rec.topic}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(rec.start_time).toLocaleDateString()}</p>
                                    </div>
                                </button>
                            ))}
                            {recordings.length === 0 && (
                                <div className="py-10 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                                    <PlayCircle className="w-6 h-6 text-slate-200 mx-auto" />
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">No recordings yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── CENTER: Focus Area ── */}
                <div className="lg:col-span-9 xl:col-span-5 space-y-6">
                    {/* Live Section */}
                    {nextBatchMeeting ? (
                        <div className="group relative w-full aspect-[16/9] sm:aspect-[2.5/1] rounded-[1.75rem] overflow-hidden shadow-lg border border-slate-100 bg-slate-900 shrink-0">
                            <Image 
                                src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2420&auto=format&fit=crop" 
                                alt="Live Session"
                                fill
                                className="object-cover opacity-50 transition-transform duration-[2000ms] group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#e76f51] animate-pulse" />
                                    Session Upcoming
                                </div>
                            </div>
                            <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="space-y-2 max-w-md">
                                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight line-clamp-1">{nextBatchMeeting.topic}</h2>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 text-white/50 text-[9px] font-bold uppercase tracking-widest">
                                            <Calendar className="w-3 h-3" /> {new Date(nextBatchMeeting.start_time).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2 text-white/50 text-[9px] font-bold uppercase tracking-widest">
                                            <Clock className="w-3 h-3" /> {new Date(nextBatchMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                <button disabled={!isJoinEnabled} onClick={() => window.open(nextBatchMeeting.join_url, '_blank')} className={cn("h-12 px-8 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shrink-0", isJoinEnabled ? "bg-[#e76f51] text-white hover:scale-[1.02] shadow-lg shadow-[#e76f51]/20" : "bg-white/10 text-white/20 backdrop-blur-md border border-white/10 cursor-not-allowed")}>
                                    {isJoinEnabled ? <><Video className="w-4 h-4" /> Join Now</> : 'Opens Soon'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative overflow-hidden rounded-[1.75rem] w-full aspect-[16/9] sm:aspect-[2.5/1] border border-slate-100 flex flex-col items-center justify-center gap-4 bg-slate-50">
                            <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110">
                                <Video className="w-5 h-5 text-slate-300" />
                            </div>
                            <div className="space-y-1 text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">No Sessions Scheduled</p>
                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Your Zoom link will appear here</p>
                            </div>
                        </div>
                    )}

                    {/* Journey Rail */}
                    <div className="p-6 sm:p-8 rounded-[1.75rem] border border-slate-100 flex flex-col gap-8 bg-white shadow-sm shrink-0">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Day {currentDay} Journey</h3>
                            </div>

                            <JourneyProgress
                                currentDay={currentDayInMonth}
                                activeDay={activeStepDay}
                                onSelectDay={(day) => setActiveStepDay(day)}
                                completedDays={new Set(journeyLogs.map((l: JourneyLog) => l.day_number).filter((d: number) => Math.ceil(d / 30) === currentMonth).map((d: number) => ((d - 1) % 30) + 1))}
                            />

                            {/* 3-Angle Photo Tracker */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">📸 3-Angle Progress</span>
                                    <span className="text-[8px] text-foreground/30 font-medium">— Front, Left &amp; Right profiles</span>
                                </div>
                                <AnglePhotoTracker
                                    dayNumber={activeStepDay}
                                    savedPhotos={{
                                        front: activeLog?.photo_url ?? [...journeyLogs].filter((l: JourneyLog) => l.photo_url).sort((a: JourneyLog, b: JourneyLog) => b.day_number - a.day_number)[0]?.photo_url ?? null,
                                        left:  activeLog?.photo_url_left ?? [...journeyLogs].filter((l: JourneyLog) => l.photo_url_left).sort((a: JourneyLog, b: JourneyLog) => b.day_number - a.day_number)[0]?.photo_url_left ?? null,
                                        right: activeLog?.photo_url_right ?? [...journeyLogs].filter((l: JourneyLog) => l.photo_url_right).sort((a: JourneyLog, b: JourneyLog) => b.day_number - a.day_number)[0]?.photo_url_right ?? null,
                                    }}
                                    day1Photos={{
                                        front: day1Log?.photo_url ?? null,
                                        left:  day1Log?.photo_url_left ?? null,
                                        right: day1Log?.photo_url_right ?? null,
                                    }}
                                    onSave={handleSavePhotos}
                                    isSaving={isSavingLog}
                                    accentColor="#e76f51"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-3">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">📝 Daily Notes — Day {activeStepDay}</p>
                                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                                    <textarea
                                        value={notesInput}
                                        onChange={(e) => setNotesInput(e.target.value)}
                                        className="w-full resize-none bg-transparent text-foreground/70 text-sm font-medium outline-none border-none focus:ring-0 custom-scrollbar min-h-[80px]"
                                        placeholder="How are you feeling today?"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        setIsSavingLog(true);
                                        const { success } = await saveDailyCheckIn(currentUser.id, activeStepDay, notesInput.trim() || null);
                                        setIsSavingLog(false);
                                    }}
                                    disabled={isSavingLog}
                                    className="h-11 w-full rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#e76f51] transition-colors duration-300 disabled:opacity-60"
                                >
                                    {isSavingLog ? 'Saving…' : 'Save Update'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:hidden h-20" /> {/* Mobile Spacing */}
                </div>

                {/* ── RIGHT RAIL: Communion (Desktop) ── */}
                <div className="hidden xl:flex xl:col-span-4 flex-col gap-6 shrink-0 h-[calc(100vh-8rem)] sticky top-8">
                    <div className="rounded-[1.75rem] border border-slate-100 h-full flex flex-col overflow-hidden bg-white shadow-sm">
                        {chatContent}
                    </div>
                </div>
            </main>

            <div className="xl:hidden fixed bottom-6 right-6 z-[60]">
               <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setIsChatOpen(true)}
                  className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl relative"
               >
                  <MessageSquare className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <div className="absolute top-0 right-0 h-4 w-4 bg-[#e76f51] rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold">
                        {unreadCount}
                    </div>
                  )}
               </motion.button>
            </div>

            {/* Mobile Chat Drawer */}
            <AnimatePresence>
               {isChatOpen && (
                  <>
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsChatOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] xl:hidden" />
                     <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 200 }} className="fixed inset-x-0 bottom-0 top-16 bg-background rounded-t-[3rem] z-[80] xl:hidden flex flex-col overflow-hidden shadow-2xl border-t border-outline-variant/10">
                        <div className="px-8 py-6 border-b border-outline-variant/5 flex items-center justify-between shrink-0">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                 <Users className="w-5 h-5" />
                              </div>
                              <h3 className="text-xl font-bold tracking-tight">The Circle</h3>
                           </div>
                           <button onClick={() => setIsChatOpen(false)} className="h-10 w-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-hidden">{chatContent}</div>
                     </motion.div>
                  </>
               )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
