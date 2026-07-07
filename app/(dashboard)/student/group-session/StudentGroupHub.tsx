'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { JourneyProgress } from '@/components/ui/journey-progress';
import {
    Calendar, Users, Star,
    Flame, PlayCircle, FileText, Download, CheckCircle, Send,
    Video, Clock, Sparkles, ChevronRight, Play, ShieldCheck, MessageSquare, X,
    ArrowUpRight, Camera
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '../../../../lib/supabase/client';
import { getBatchMessages, sendBatchMessage } from '../../../../lib/actions/chat';
import { getBatchPollsMap, getPollById, votePoll } from '../../../../lib/actions/polls';
import { getJourneyLogs, saveDailyCheckIn, type JourneyLog } from '../../../../lib/actions/journey';
import { getUpcomingMeetingsForStudent, getBatchRecordedSessions, getLatestMeetingForBatch } from '../../../../lib/actions/meetings';
import { AnglePhotoTracker } from '../../../../components/ui/angle-photo-tracker';
import { PlanExpiryPill } from '../../../../components/ui/plan-expiry-pill';
import { PollCard } from '../../../../components/ui/poll-card';
import { useRouter } from 'next/navigation';
import { cn, formatISTDate, formatISTTime, getSessionStatus } from '@/lib/utils';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { SupportContact } from '@/components/ui/SupportContact';

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
    const [messages, setMessages] = useState<any[]>([]); // Keep any[] for now as it's complex, but guard its rendering
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMounted, setIsMounted] = useState(false);
    const isChatEnabled = activeBatch?.is_chat_enabled ?? true;

    useEffect(() => {
        setIsMounted(true);
    }, []);
    const supabase = useMemo(() => createClient(), []);

    const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingWithDetails[]>([]);
    const [recordings, setRecordings] = useState<RecordedSession[]>([]);
    const [recordingPage, setRecordingPage] = useState(0);
    const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
    const [polls, setPolls] = useState<Record<string, BatchPoll>>({});
    const [votingPollId, setVotingPollId] = useState<string | null>(null);
    const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
    const [activeStepDay, setActiveStepDay] = useState<number>(1);
    const [notesInput, setNotesInput] = useState('');
    const [isSavingLog, setIsSavingLog] = useState(false);

    const activeLog = journeyLogs.find((l: JourneyLog) => l.day_number === activeStepDay);
    const day1Log = journeyLogs.find((l: JourneyLog) => l.day_number === 1);

    const effectiveAnchorDate = React.useMemo(() => {
        if (activeBatch?.start_date && subscriptionStartDate) {
            const batchStart = new Date(activeBatch.start_date);
            const subStart = new Date(subscriptionStartDate);
            return subStart > batchStart ? subscriptionStartDate : activeBatch.start_date;
        }
        return activeBatch?.start_date || subscriptionStartDate || null;
    }, [activeBatch?.start_date, subscriptionStartDate]);

    const currentDay = React.useMemo(() => {
        const anchorDateStr = effectiveAnchorDate;
        if (!anchorDateStr) return 1;

        const startDate = new Date(anchorDateStr);
        const now = new Date();
        const diffTime = now.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return Math.min(JOURNEY_MAX_DAY, Math.max(1, diffDays));
    }, [effectiveAnchorDate]);

    const currentMonth = Math.ceil(currentDay / 30);
    const currentDayInMonth = ((currentDay - 1) % 30) + 1;

    useEffect(() => {
        setActiveStepDay(currentDay);
    }, [currentDay]);

    useEffect(() => {
        if (!activeBatch?.id) return;

        const init = async () => {
            // Fetch critical dashboard data first
            const [msgs, pollsMap, logs, meetingsData] = await Promise.all([
                getBatchMessages(activeBatch.id),
                getBatchPollsMap(activeBatch.id, currentUser.id),
                getJourneyLogs(currentUser.id),
                getUpcomingMeetingsForStudent(),
            ]);

            setMessages(msgs);
            setPolls(pollsMap);
            setJourneyLogs(logs);
            setUpcomingMeetings(meetingsData || []);

            // Fetch recordings separately so they don't block the critical path
            setIsLoadingRecordings(true);
            try {
                const [recs, latestMeeting] = await Promise.all([
                    getBatchRecordedSessions(activeBatch.id, activeBatch.end_date ?? ''),
                    getLatestMeetingForBatch(activeBatch.id)
                ]);
                setRecordings(recs);
                if (latestMeeting && !meetingsData.some(m => m.id === latestMeeting.id)) {
                    setUpcomingMeetings(prev => [...prev, latestMeeting]);
                }
            } catch (err) {
                console.error("Error fetching recordings:", err);
            } finally {
                setIsLoadingRecordings(false);
            }
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
                async (payload: { new: { id: string; sender_id: string; message_type?: string; poll_id?: string } }) => {
                    setMessages((prev: any[]) => {
                        if (prev.some(m => m.id === payload.new.id)) return prev;

                        const fetchAndAppend = async () => {
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('id, full_name, avatar_url, role')
                                .eq('id', payload.new.sender_id)
                                .single();

                            setMessages((curr) => {
                                if (curr.some(m => m.id === payload.new.id)) return curr;
                                return [...curr, { ...payload.new, sender: profile }];
                            });

                            if (payload.new.message_type === 'poll' && payload.new.poll_id) {
                                const pollData = await getPollById(payload.new.poll_id, currentUser.id);
                                if (pollData) setPolls((prev: Record<string, BatchPoll>) => ({ ...prev, [pollData.id]: pollData }));
                            }
                        };
                        fetchAndAppend();
                        return prev;
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'batch_messages',
                    filter: `batch_id=eq.${activeBatch.id}`
                },
                (payload: any) => {
                    const updatedMessage = payload.new;
                    if (updatedMessage) {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === updatedMessage.id
                                    ? { ...msg, content: updatedMessage.content, content_type: updatedMessage.content_type }
                                    : msg
                            )
                        );
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

        const content = newMessage.trim();
        setNewMessage('');

        // Optimistic update
        const tempId = Math.random().toString(36).slice(2, 9);
        const optimisticMsg = {
            id: tempId,
            content,
            sender_id: currentUser.id,
            batch_id: activeBatch.id,
            created_at: new Date().toISOString(),
            sender: {
                id: currentUser.id,
                full_name: currentUser.full_name,
                avatar_url: currentUser.avatar_url,
                role: currentUser.role
            }
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        try {
            const res = await sendBatchMessage(activeBatch.id, content, currentUser.id);
            if (!res.success) {
                setMessages((prev) => prev.filter(m => m.id !== tempId));
                setNewMessage(content);
            } else if (res.message) {
                // Replace optimistic message with the one from server (has real ID)
                setMessages((prev) => prev.map(m => m.id === tempId ? { ...res.message, sender: optimisticMsg.sender } : m));
            }
        } catch (err: any) {
            console.error("SEND ERROR:", err);
            setMessages((prev) => prev.filter(m => m.id !== tempId));
            setNewMessage(content);
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

    const isJoinEnabled = useMemo(() => {
        if (!nextBatchMeeting) return false;
        const now = new Date();
        const startTime = new Date(nextBatchMeeting.start_time);
        const diff = (startTime.getTime() - now.getTime()) / (1000 * 60);
        return diff <= 10; // Enable 10 mins before
    }, [nextBatchMeeting]);

    const isSessionClosed = useMemo(() => {
        if (!nextBatchMeeting) return false;
        const now = new Date();
        const startTime = new Date(nextBatchMeeting.start_time);
        const duration = nextBatchMeeting.duration_minutes || 60;
        const endTime = new Date(startTime.getTime() + duration * 60000);

        // If there's a recording for this specific meeting ID, it's definitely ended
        const hasRecording = recordings.some(r => r.id === nextBatchMeeting.id);

        // Or if it's 30 mins past the scheduled end time
        const isPastBuffer = now > new Date(endTime.getTime() + 30 * 60000);

        return hasRecording || isPastBuffer;
    }, [nextBatchMeeting, recordings]);

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
                    const isOwn = msg.sender_id === currentUser.id;
                    const isPoll = msg.message_type === 'poll';
                    const poll = isPoll ? polls[msg.poll_id] : null;

                    if (isPoll) {
                        return (
                            poll && (
                                <div key={msg.id} className="w-full">
                                    <PollCard
                                        poll={poll}
                                        isAdmin={false}
                                        onVote={(id: string) => handleVotePoll(poll.id, id)}
                                        isVoting={votingPollId === poll.id}
                                    />
                                </div>
                            )
                        );
                    }

                    return (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={isOwn}
                            showSender={msg.sender_id !== currentUser.id}
                            isMultiParty={true}
                            dark={false}
                            currentUserRole={currentUser.role}
                        />
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
                            className="w-full h-12 pl-5 pr-12 rounded-xl bg-white border border-outline-variant/10 text-base text-foreground font-medium placeholder:text-foreground/20 focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all shadow-sm group-hover:border-primary/20"
                        />
                        <button onClick={handleSendMessage} className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="h-12 rounded-xl bg-foreground/5 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-foreground/20">Chat is turned off</div>
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
                    Trial Access Active: {trialEndDate && isMounted && <span>{new Date(trialEndDate).toLocaleDateString()}</span>}
                </div>
            )}

            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900 tracking-tight">
                        Group <span className="text-[#e76f51]">Hub</span>
                    </h1>
                </div>
                <SupportContact className="px-3.5 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm" />
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pb-20 lg:pb-0">
                {/* ── LEFT RAIL: Batch Meta ── */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {/* Meeting Section */}
                    {nextBatchMeeting && (
                        <div className="p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/50 flex flex-col gap-6 relative overflow-hidden group">
                            {/* Decorative Background Accent */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#e76f51]/5 rounded-full blur-[40px] group-hover:bg-[#e76f51]/10 transition-colors duration-700" />

                            <div className="space-y-4 relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e76f51]/10 border border-[#e76f51]/10 text-[#e76f51] text-[9px] font-black uppercase tracking-widest">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", isSessionClosed ? "bg-slate-400" : "bg-[#e76f51] animate-pulse")} />
                                    {isSessionClosed ? 'Session Ended' : isJoinEnabled ? 'Session is LIVE' : 'Scheduled Session'}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">{nextBatchMeeting.topic}</h2>
                                    <div className="space-y-1.5">
                                        {(() => {
                                            const status = getSessionStatus(nextBatchMeeting.start_time, nextBatchMeeting.duration_minutes || 60, nextBatchMeeting.calendar_event_id);
                                            const isExpired = status === 'expired';
                                            const isCompleted = status === 'completed';
                                            return (
                                                <>
                                                {(isExpired || isCompleted) && (
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                        isExpired ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'
                                                    )}>
                                                        {isExpired ? 'Expired' : '✓ Completed'}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                    <Calendar className="w-3.5 h-3.5" /> 
                                                    {isMounted ? formatISTDate(nextBatchMeeting.start_time) : '---'}
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                    <Clock className="w-3.5 h-3.5" /> 
                                                    {isMounted ? `${formatISTTime(nextBatchMeeting.start_time)} IST` : '--:--'}
                                                </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {isSessionClosed ? (
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 relative z-10">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                        Stay tuned for the next session or view the recap in the recordings card below.
                                    </p>
                                </div>
                            ) : (
                                <button
                                    onClick={() => window.open(nextBatchMeeting.join_url, '_blank')}
                                    className="h-12 w-full rounded-xl bg-[#e76f51] text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-lg shadow-[#e76f51]/20 flex items-center justify-center gap-3 shrink-0 relative z-10"
                                >
                                    <Video className="w-4 h-4" /> Join Session
                                </button>
                            )}
                        </div>
                    )}

                    {/* Recordings */}
                    <div className="p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 bg-white shadow-sm flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Recordings</h3>
                            <PlayCircle className="w-4 h-4 text-slate-300" />
                        </div>

                        <div className="space-y-4">
                            <div className="min-h-[80px]">
                                {recordings.length > 0 ? (
                                    <div className="space-y-3">
                                        {recordings.slice(recordingPage, recordingPage + 1).map((rec: RecordedSession) => (
                                            <button
                                                key={rec.id}
                                                onClick={() => rec.is_available && window.open(rec.play_url!, '_blank')}
                                                className="w-full flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-100/50 rounded-xl hover:border-[#e76f51]/20 hover:bg-white hover:shadow-sm transition-all text-left group"
                                            >
                                                <div className="h-9 w-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-[#e76f51] transition-colors">
                                                    <Play className="w-3.5 h-3.5 fill-current" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold text-slate-700 truncate">{rec.topic}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{isMounted ? formatISTDate(rec.start_time) : '---'}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-[9px] font-bold uppercase tracking-widest text-slate-300">No recordings</div>
                                )}
                            </div>

                            {recordings.length > 1 && (
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                    <button
                                        onClick={() => setRecordingPage(p => Math.max(0, p - 1))}
                                        disabled={recordingPage === 0}
                                        className="p-2 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors"
                                    >
                                        <X className="w-4 h-4 rotate-180" /> {/* Using X as a placeholder for chevron if needed, but I'll use text */}
                                        <span className="sr-only">Prev</span>
                                        <div className="w-4 h-4 border-l-2 border-b-2 border-slate-400 rotate-45 ml-1" />
                                    </button>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {recordingPage + 1} / {recordings.length}
                                    </span>
                                    <button
                                        onClick={() => setRecordingPage(p => Math.min(recordings.length - 1, p + 1))}
                                        disabled={recordingPage >= recordings.length - 1}
                                        className="p-2 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors"
                                    >
                                        <span className="sr-only">Next</span>
                                        <div className="w-4 h-4 border-r-2 border-t-2 border-slate-400 rotate-45 mr-1" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vault Resources */}
                    <div className="p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 bg-white shadow-sm flex flex-col gap-5 min-h-[500px]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Vault</h3>
                            <FileText className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="space-y-2 max-h-[800px] overflow-y-auto custom-scrollbar pr-1">
                            {initialResources.length > 0 ? (
                                initialResources.map((res: any) => (
                                    <button key={res.id} onClick={() => window.open(res.file_url, '_blank')} className="w-full flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-100/50 rounded-xl hover:border-[#e76f51]/20 hover:bg-white hover:shadow-sm transition-all text-left group">
                                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-[#e76f51] transition-colors">
                                            <Download className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-slate-700 truncate">{res.title || res.file_name}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="py-6 text-center text-[9px] font-bold uppercase tracking-widest text-slate-300">No resources</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── CENTER: Focus Area ── */}
                <div className="lg:col-span-9 xl:col-span-6 space-y-8">
                    {/* Journey Central - Premium Stack */}
                    <div className="p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 flex flex-col gap-8 sm:gap-10 bg-white shadow-xl shadow-slate-200/50">
                        <div className="flex flex-col gap-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Day {currentDay} Journey</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress Tracker & Daily Log</p>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#e76f51] shadow-[0_0_12px_rgba(231,111,81,0.5)]" />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">Active</span>
                                </div>
                            </div>

                            <div className="w-full">
                                <JourneyProgress
                                    currentDay={currentDayInMonth}
                                    activeDay={activeStepDay}
                                    onSelectDay={(day) => setActiveStepDay(day)}
                                    completedDays={new Set(journeyLogs.map((l: JourneyLog) => l.day_number).filter((d: number) => Math.ceil(d / 30) === currentMonth).map((d: number) => ((d - 1) % 30) + 1))}
                                />
                            </div>

                            {/* Somatic Progress Section */}
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-[#e76f51]/10 flex items-center justify-center">
                                            <Camera className="w-4 h-4 text-[#e76f51]" />
                                        </div>
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Somatic Progress</h4>
                                    </div>

                                    {(() => {
                                        const milestones = [7, 14, 21, 25];
                                        const nextMilestone = milestones.find(m => m >= currentDay) || 25;
                                        const anchorDateStr = effectiveAnchorDate;
                                        let milestoneDateStr = '';

                                        if (anchorDateStr) {
                                            const d = new Date(anchorDateStr);
                                            d.setDate(d.getDate() + (nextMilestone - 1));
                                            milestoneDateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                        }

                                        return (
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                                                Next Milestone: {milestoneDateStr || `Day ${nextMilestone}`} ({nextMilestone - currentDay === 1 ? 'Tomorrow' : `In ${nextMilestone - currentDay} Days`})
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="p-1 rounded-[1.75rem] sm:rounded-[2.5rem] bg-slate-50/50 border border-slate-100 shadow-inner overflow-hidden">
                                    <AnglePhotoTracker
                                        dayNumber={currentDay}
                                        savedPhotos={{
                                            front: activeLog?.photo_url ?? [...journeyLogs].filter((l: JourneyLog) => l.photo_url).sort((a: JourneyLog, b: JourneyLog) => b.day_number - a.day_number)[0]?.photo_url ?? null,
                                            left: activeLog?.photo_url_left ?? [...journeyLogs].filter((l: JourneyLog) => l.photo_url_left).sort((a: JourneyLog, b: JourneyLog) => b.day_number - a.day_number)[0]?.photo_url_left ?? null,
                                            right: activeLog?.photo_url_right ?? [...journeyLogs].filter((l: JourneyLog) => l.photo_url_right).sort((a: JourneyLog, b: JourneyLog) => b.day_number - a.day_number)[0]?.photo_url_right ?? null,
                                        }}
                                        day1Photos={{
                                            front: day1Log?.photo_url ?? null,
                                            left: day1Log?.photo_url_left ?? null,
                                            right: day1Log?.photo_url_right ?? null,
                                        }}
                                        onSave={handleSavePhotos}
                                        isSaving={isSavingLog}
                                        accentColor="#e76f51"
                                    />
                                    {(() => {
                                        const milestones = [7, 14, 21, 25];
                                        const isMilestoneDay = milestones.includes(currentDay);
                                        const nextMilestone = milestones.find(m => m > currentDay);

                                        if (!isMilestoneDay && nextMilestone) {
                                            const daysRemaining = nextMilestone - currentDay;
                                            const anchorDateStr = effectiveAnchorDate;
                                            let milestoneDateStr = '';

                                            if (anchorDateStr) {
                                                const d = new Date(anchorDateStr);
                                                d.setDate(d.getDate() + (nextMilestone - 1));
                                                milestoneDateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                            }

                                            return (
                                                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Photo Upload</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#e76f51]">
                                                        {milestoneDateStr} ({daysRemaining === 1 ? 'Tomorrow' : `In ${daysRemaining} Days`})
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                        <MessageSquare className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">📝 Daily Notes</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="rounded-[2rem] bg-slate-50 p-6 border border-slate-100 focus-within:border-[#e76f51]/30 focus-within:bg-white transition-all duration-300">
                                        <textarea
                                            value={notesInput}
                                            onChange={(e) => setNotesInput(e.target.value)}
                                            className="w-full resize-none bg-transparent text-slate-600 text-base font-medium outline-none border-none focus:ring-0 custom-scrollbar min-h-[160px]"
                                            placeholder="Capture your breakthrough moments..."
                                        />
                                    </div>
                                    <button
                                        onClick={async () => {
                                            setIsSavingLog(true);
                                            const { success } = await saveDailyCheckIn(currentUser.id, activeStepDay, notesInput.trim() || null);
                                            setIsSavingLog(false);
                                        }}
                                        disabled={isSavingLog}
                                        className="h-14 w-full rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#e76f51] shadow-xl shadow-slate-900/10 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-3"
                                    >
                                        {isSavingLog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {isSavingLog ? 'Saving…' : 'Update Journal'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="lg:hidden h-24" /> {/* Mobile Spacing */}
                </div>

                {/* ── RIGHT RAIL: Communion (Desktop) ── */}
                <div className="hidden xl:block xl:col-span-3 sticky top-8 h-[calc(100vh-4rem)]">
                    <div className="rounded-[2.5rem] border border-slate-100 h-full flex flex-col overflow-hidden bg-white shadow-2xl shadow-slate-200/50">
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
