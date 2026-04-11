'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Calendar, Users, Star,
    Flame, PlayCircle, FileText, Download, CheckCircle, Send, Camera,
    Video, Clock, Sparkles, ChevronRight, Play, ShieldCheck, MessageSquare, X,
    ArrowUpRight, Edit3
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '../../../../lib/supabase/client';
import { getBatchMessages, sendBatchMessage } from '../../../../lib/actions/chat';
import { getBatchPollsMap, getPollById, votePoll } from '../../../../lib/actions/polls';
import { getJourneyLogs, saveDailyCheckIn, type JourneyLog } from '../../../../lib/actions/journey';
import { getUpcomingMeetingsForStudent, getBatchRecordedSessions } from '../../../../lib/actions/meetings';
import { ImageComparison } from '../../../../components/ui/image-comparison-slider';
import { JourneyProgress, JOURNEY_MAX_DAY, JOURNEY_MILESTONES } from '../../../../components/ui/journey-progress';
import { PlanExpiryPill } from '../../../../components/ui/plan-expiry-pill';
import { PollCard } from '../../../../components/ui/poll-card';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

import type { Profile, MeetingWithDetails, BatchPoll, RecordedSession } from '../../../../types/database';

interface StudentGroupClientProps {
    currentUser: Profile;
    activeBatch: any;
    initialResources: any[];
    isTrialAccess?: boolean;
    trialEndDate?: string | null;
    subscriptionStartDate?: string | null;
}

export function StudentGroupHub({ currentUser, activeBatch, initialResources, isTrialAccess = false, trialEndDate, subscriptionStartDate }: StudentGroupClientProps) {
    const isChatEnabled = activeBatch?.is_chat_enabled ?? true;
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
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
    const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
    const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeLog = journeyLogs.find(l => l.day_number === activeStepDay);
    const day1Log = journeyLogs.find(l => l.day_number === 1);
    const hasDay1Photo = !!day1Log?.photo_url;
    
    // Use professional placeholders from assets
    const placeholderBefore = '/assets/before_img.png';
    const placeholderAfter = '/assets/after_img.png';

    const beforeImage = day1Log?.photo_url || placeholderBefore;
    let afterImage = activeLog?.photo_url || selectedImageBase64 || (activeStepDay >= 7 ? placeholderAfter : beforeImage);

    // Special logic for Day 1 placeholders
    if (activeStepDay === 1 && !hasDay1Photo) {
        afterImage = placeholderAfter;
    }

    // Slider is active on Day 1 (before upload) and Day 7+
    const isSliderActive = (activeStepDay === 1 && !hasDay1Photo) || (activeStepDay >= 7);

    const currentDay = React.useMemo(() => {
        const anchorDateStr = activeBatch?.start_date || subscriptionStartDate;
        if (!anchorDateStr) return 1;

        const startDate = new Date(anchorDateStr);
        const now = new Date();
        const diffTime = now.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return Math.min(JOURNEY_MAX_DAY, Math.max(1, diffDays));
    }, [subscriptionStartDate, activeBatch?.start_date]);

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
                async (payload: any) => {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, role')
                        .eq('id', payload.new.sender_id)
                        .single();
                    setMessages(prev => [...prev, { ...payload.new, sender: profile }]);

                    if (payload.new.message_type === 'poll' && payload.new.poll_id) {
                        const pollData = await getPollById(payload.new.poll_id, currentUser.id);
                        if (pollData) setPolls(prev => ({ ...prev, [pollData.id]: pollData }));
                    }
                }
            )
            .subscribe();

        const voteChannel = supabase
            .channel(`student-votes-${activeBatch.id}-${Math.random().toString(36).slice(2, 9)}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'batch_poll_votes' },
                async (payload: any) => {
                    const pollId = payload.new?.poll_id;
                    if (!pollId) return;
                    const updated = await getPollById(pollId, currentUser.id);
                    if (updated) setPolls(prev => ({ ...prev, [pollId]: updated }));
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
        setNotesInput(activeLog?.notes || '');
        setSelectedImageBase64(null);
    }, [activeStepDay, activeLog]);

    const handleVotePoll = async (pollId: string, optionId: string) => {
        setVotingPollId(pollId);
        const res = await votePoll(pollId, optionId);
        if (res.success) {
            const updated = await getPollById(pollId, currentUser.id);
            if (updated) setPolls(prev => ({ ...prev, [pollId]: updated }));
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

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Str = event.target?.result as string;
            setSelectedImageBase64(base64Str.split(',')[1]);
            setSelectedImageMime(file.type);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveLog = async () => {
        setIsSavingLog(true);
        const { success, data } = await saveDailyCheckIn(currentUser.id, activeStepDay, notesInput.trim() || null, selectedImageBase64, selectedImageMime || 'image/jpeg');
        if (success && data) {
            setJourneyLogs(prev => [...prev.filter(l => l.day_number !== activeStepDay), data]);
            setSelectedImageBase64(null);
        }
        setIsSavingLog(false);
    };

    const nextBatchMeeting = upcomingMeetings.find(m => m.batch_id === activeBatch?.id);
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
                {messages.map((msg) => {
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
                                poll && <div className="w-full"><PollCard poll={poll} isAdmin={false} onVote={(id) => handleVotePoll(poll.id, id)} isVoting={votingPollId === poll.id} /></div>
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
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
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
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background animate-in fade-in duration-1000 relative">
            <div className="fixed top-0 right-0 w-[50vw] h-[50vh] bg-primary/2 rounded-full blur-[120px] -z-10" />

            {subscriptionStartDate && (
                <PlanExpiryPill 
                    subscriptionStartDate={subscriptionStartDate} 
                    planName={activeBatch?.name || "The Circle"}
                />
            )}

            {isTrialAccess && (
                <div className="relative z-10 flex items-center justify-center gap-2 bg-foreground text-background px-4 py-1.5 shrink-0 text-[10px] font-bold uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Trial Access Active: {trialEndDate && <span>{new Date(trialEndDate).toLocaleDateString()}</span>}
                </div>
            )}

            <main className="flex-1 flex overflow-hidden p-4 sm:p-6 lg:p-10 gap-8">
                {/* ── LEFT RAIL: Batch Meta ── */}
                <div className="hidden lg:flex w-80 flex-col gap-8 shrink-0 overflow-y-auto no-scrollbar pb-10">
                    <div className="surface-container p-8 rounded-3xl flex flex-col gap-8 border border-outline-variant/10 h-min bg-white/50 backdrop-blur-xl shadow-sm">
                        <div className="space-y-1.5">
                            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-foreground tracking-tight line-clamp-2">
                                    {activeBatch?.name || 'Your Batch'}
                                </h2>
                                {isTrialAccess && (
                                    <span className="text-[10px] font-black uppercase text-white bg-red-500 px-1.5 py-0.5 rounded shadow-sm leading-none whitespace-nowrap">Trial</span>
                                )}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Group Journey</p>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-11 w-11 rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm bg-white shrink-0">
                                    {activeBatch?.instructor?.avatar_url ? (
                                        <img src={activeBatch.instructor.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-foreground/20 bg-foreground/5">{(activeBatch?.instructor?.full_name || 'I').charAt(0).toUpperCase()}</div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/30 leading-none mb-1">Your Guide</p>
                                    <p className="text-sm font-bold text-foreground truncate">{activeBatch?.instructor?.full_name || 'Instructor'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-11 w-11 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                                    <Flame className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/30 leading-none mb-1">Current Streak</p>
                                    <p className="text-sm font-bold text-foreground truncate">Day {currentDay}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="surface-container p-8 rounded-3xl border border-outline-variant/10 flex-1 overflow-hidden flex flex-col bg-white/50 backdrop-blur-xl shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30">Resources</h3>
                            <FileText className="w-4 h-4 text-foreground/20" />
                        </div>
                        <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                            {initialResources.map((res: any) => (
                                <button key={res.id} onClick={() => window.open(res.file_url, '_blank')} className="w-full flex items-center gap-4 p-4 bg-white/40 border border-outline-variant/5 rounded-2xl hover:border-primary/20 hover:bg-white hover:shadow-md transition-all text-left group">
                                    <div className="h-10 w-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/20 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                        <Download className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">{res.title || res.file_name}</p>
                                        <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest mt-0.5">Download File</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── CENTER: Focus Area ── */}
                <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 no-scrollbar pb-10">
                    {/* Live Section */}
                    {nextBatchMeeting ? (
                        <div className="group relative w-full h-[320px] sm:h-80 rounded-[2rem] sm:rounded-3xl overflow-hidden shadow-xl border border-outline-variant/10 bg-black shrink-0">
                            <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2420&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 transition-transform duration-[2000ms] group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    Session Upcoming
                                </div>
                            </div>
                            <div className="absolute inset-x-6 bottom-6 sm:inset-x-8 sm:bottom-8 z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-10">
                                <div className="space-y-2 sm:space-y-3 max-w-xl">
                                    <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight line-clamp-2">{nextBatchMeeting.topic}</h2>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 text-white/50 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                                            <Calendar className="w-3.5 h-3.5" /> {new Date(nextBatchMeeting.start_time).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2 text-white/50 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                                            <Clock className="w-3.5 h-3.5" /> {new Date(nextBatchMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                <button disabled={!isJoinEnabled} onClick={() => window.open(nextBatchMeeting.join_url, '_blank')} className={cn("h-14 sm:h-16 px-8 sm:px-10 rounded-2xl text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3", isJoinEnabled ? "bg-white text-black hover:scale-[1.02] shadow-lg" : "bg-white/10 text-white/20 backdrop-blur-md border border-white/10 cursor-not-allowed")}>
                                    {isJoinEnabled ? <><Play className="w-4 h-4 fill-current" /> Join</> : 'Opens Soon'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative overflow-hidden rounded-[2.5rem] w-full min-h-[180px] sm:min-h-[220px] border border-outline-variant/10 flex flex-col items-center justify-center gap-5 shadow-sm bg-gradient-to-br from-[#FF8A75]/15 via-white to-[#FF8A75]/15">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.08)_0%,transparent_70%)]" />
                            <div className="relative z-10 flex flex-col items-center justify-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-white/90 backdrop-blur-md border border-outline-variant/10 flex items-center justify-center shadow-md transition-transform duration-500 group-hover:scale-110">
                                    <Video className="w-6 h-6 text-primary/60" />
                                </div>
                                <div className="space-y-1 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75]/80">No Sessions Scheduled</p>
                                    <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">Your Zoom link will appear here</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Journey Rail */}
                    <div className="surface-container p-6 sm:p-8 rounded-[2rem] sm:rounded-3xl border border-outline-variant/10 flex flex-col gap-8 sm:gap-10 overflow-hidden bg-white/50 backdrop-blur-xl shadow-sm shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Day {currentDay} Journey</h3>
                            <div className="overflow-x-auto no-scrollbar py-1">
                                <JourneyProgress currentDay={currentDay} activeDay={activeStepDay} onSelectDay={setActiveStepDay} completedDays={new Set(journeyLogs.map(l => l.day_number))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 items-center">
                            <div className="relative aspect-video rounded-3xl overflow-hidden border border-outline-variant/10 shadow-lg bg-surface-container-highest">
                                {isSliderActive ? (
                                    <ImageComparison beforeImage={beforeImage} afterImage={afterImage as string} altBefore="Baseline" altAfter="Progress" />
                                ) : (
                                    <div className="w-full h-full relative group">
                                        <img 
                                            src={afterImage as string} 
                                            alt={`Progress Day ${activeStepDay}`} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
                                            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-[8.5px] font-bold text-white uppercase tracking-widest border border-white/10">
                                                {activeStepDay === 1 ? "Day 1 Baseline" : `Day ${activeStepDay} Progress`}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2 text-center md:text-left">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Daily Snapshot</h4>
                                    <p className="text-xs sm:text-sm text-foreground/40 font-medium leading-relaxed">Capture your evolution on milestone days.</p>
                                </div>
                                {(activeStepDay === 1 || activeStepDay === 7 || activeStepDay === 14 || activeStepDay === 21 || activeStepDay === 25 || JOURNEY_MILESTONES.includes(activeStepDay)) ? (
                                    <div className="flex flex-col gap-3">
                                        <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} className="h-14 w-full rounded-2xl bg-white border border-outline-variant/10 shadow-sm flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:border-primary/20 transition-all">
                                            <Camera className="w-4 h-4 text-primary" /> Select Photo
                                        </button>
                                        {selectedImageBase64 && (
                                            <button onClick={handleSaveLog} disabled={isSavingLog} className="h-14 w-full rounded-2xl bg-foreground text-background shadow-lg flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                                                {isSavingLog ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Save
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-28 sm:h-32 rounded-2xl border border-dashed border-outline-variant/20 flex flex-col items-center justify-center p-6 text-center opacity-40 bg-foreground/[0.02]">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Milestone Required</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recordings Suite */}
                    <div className="surface-container rounded-[2rem] sm:rounded-3xl border border-outline-variant/10 flex flex-col overflow-hidden bg-white/50 backdrop-blur-xl shadow-sm shrink-0">
                        <div className="p-6 sm:p-8 border-b border-outline-variant/5 flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Practice Recordings</h3>
                            <PlayCircle className="w-4 h-4 text-foreground/10" />
                        </div>
                        <div className="flex overflow-x-auto p-6 sm:p-8 gap-6 custom-scrollbar no-scrollbar">
                            {recordings.map((rec) => (
                                <div key={rec.id} className="min-w-[260px] sm:min-w-[280px] w-[260px] sm:w-[280px] flex flex-col bg-white border border-outline-variant/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group shrink-0">
                                    <div className="aspect-video relative overflow-hidden bg-foreground/[0.02]">
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                            {rec.is_available ? (
                                                <button onClick={() => window.open(rec.play_url!, '_blank')} className="h-10 w-10 rounded-full bg-white text-black shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Play className="w-4 h-4 fill-current" />
                                                </button>
                                            ) : (
                                                <div className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">Processing</div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-bold text-white/90 uppercase tracking-widest">{rec.duration_minutes}m</div>
                                    </div>
                                    <div className="p-5 space-y-1">
                                        <p className="text-[8px] font-bold text-primary uppercase">{new Date(rec.start_time).toLocaleDateString()}</p>
                                        <h4 className="text-sm font-bold text-foreground truncate">{rec.topic}</h4>
                                    </div>
                                </div>
                            ))}
                            {recordings.length === 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/20 py-10 w-full text-center">No practicing sessions recorded yet.</p>}
                        </div>
                    </div>

                    <div className="lg:hidden h-20" /> {/* Mobile Spacing */}
                </div>

                {/* ── RIGHT RAIL: Communion (Desktop) ── */}
                <div className="hidden xl:flex w-96 flex-col gap-6 shrink-0 h-full">
                    <div className="surface-container rounded-3xl border border-outline-variant/10 h-full flex flex-col overflow-hidden bg-white/50 backdrop-blur-xl shadow-sm">
                        {chatContent}
                    </div>
                </div>
            </main>

            {/* Floating Chat Button for Mobile */}
            <div className="xl:hidden fixed bottom-6 right-6 z-[60]">
               <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setIsChatOpen(true)}
                  className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center shadow-2xl relative"
               >
                  <MessageSquare className="w-7 h-7" />
                  <div className="absolute top-0 right-0 h-4 w-4 bg-primary rounded-full border-2 border-background" />
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
