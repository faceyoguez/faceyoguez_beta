'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    Calendar, Users, Star,
    Flame, PlayCircle, FileText, Download, CheckCircle, Send, Camera,
    Video, Clock
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { createClient } from '../../../../lib/supabase/client';
import { getBatchMessages, sendBatchMessage } from '../../../../lib/actions/chat';
import { getBatchPollsMap, getPollById, votePoll } from '../../../../lib/actions/polls';
import { getJourneyLogs, saveDailyCheckIn, type JourneyLog } from '../../../../lib/actions/journey';
import { getUpcomingMeetingsForStudent, getBatchRecordedSessions } from '../../../../lib/actions/meetings';
import { ImageComparison } from '../../../../components/ui/image-comparison-slider';
import { JourneyProgress, JOURNEY_MAX_DAY } from '../../../../components/ui/journey-progress';
import { PollCard } from '../../../../components/ui/poll-card';

import type { Profile, MeetingWithDetails, BatchPoll, RecordedSession } from '../../../../types/database';

interface StudentGroupClientProps {
    currentUser: Profile;
    activeBatch: any; // Using any for flexibility with joined data
    initialResources: any[];
    isTrialAccess?: boolean;
    trialEndDate?: string | null;
    subscriptionStartDate?: string | null;
}

// Milestones for the Transformation Journey are now handled by JourneyProgress component

export function StudentGroupHub({ currentUser, activeBatch, initialResources, isTrialAccess = false, trialEndDate, subscriptionStartDate }: StudentGroupClientProps) {
    const isChatEnabled = activeBatch?.is_chat_enabled ?? true;
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingWithDetails[]>([]);

    // Recordings State
    const [recordings, setRecordings] = useState<RecordedSession[]>([]);
    const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);

    // Poll State
    const [polls, setPolls] = useState<Record<string, BatchPoll>>({});
    const [votingPollId, setVotingPollId] = useState<string | null>(null);

    // Journey State
    const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
    const [activeStepDay, setActiveStepDay] = useState<number>(1);
    const [notesInput, setNotesInput] = useState('');
    const [isSavingLog, setIsSavingLog] = useState(false);
    const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
    const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeLog = journeyLogs.find(l => l.day_number === activeStepDay);
    const day1Log = journeyLogs.find(l => l.day_number === 1);
    const day25Log = journeyLogs.find(l => l.day_number === 25);
    const beforeImage = day1Log?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
    let afterImage = day25Log?.photo_url || selectedImageBase64 || null;

    // Calculate current day based on batch start date
    const currentDay = React.useMemo(() => {
        const anchorDateStr = activeBatch?.start_date || subscriptionStartDate;
        if (!anchorDateStr) return 1;
        
        const startDate = new Date(anchorDateStr);
        const now = new Date();
        const diffTime = now.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // Day 1, Day 2, etc.
        return Math.min(JOURNEY_MAX_DAY, Math.max(1, diffDays));
    }, [subscriptionStartDate, activeBatch?.start_date]);

    // Initialize active step to today's day when the batch loads
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

        // Subscribe to new chat messages (text + poll)
        const msgChannel = supabase
            .channel(`batch-chat-${activeBatch.id}`)
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

                    // If it's a poll message, fetch poll data
                    if (payload.new.message_type === 'poll' && payload.new.poll_id) {
                        const pollData = await getPollById(payload.new.poll_id, currentUser.id);
                        if (pollData) setPolls(prev => ({ ...prev, [pollData.id]: pollData }));
                    }
                }
            )
            .subscribe();

        // Subscribe to poll vote changes for live count updates
        const voteChannel = supabase
            .channel(`student-votes-${activeBatch.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'batch_poll_votes' },
                async (payload: any) => {
                    const pollId = payload.new?.poll_id;
                    if (!pollId) return;
                    // Always refetch — avoids stale closure on `polls` state
                    const updated = await getPollById(pollId, currentUser.id);
                    if (updated) setPolls(prev => ({ ...prev, [pollId]: updated }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(msgChannel);
            supabase.removeChannel(voteChannel);
        };
    }, [activeBatch?.id]);

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
        } else {
            alert(res.error);
        }
        setVotingPollId(null);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeBatch?.id) return;
        try {
            console.log("SENDING MESSAGE...", { batchId: activeBatch.id, msg: newMessage, sender: currentUser.id });
            const res = await sendBatchMessage(activeBatch.id, newMessage.trim(), currentUser.id);
            console.log("SERVER ACTION RES:", res);
            if (res.success) {
                setNewMessage('');
            } else {
                alert("Server Action Rejected: " + res.error);
            }
        } catch (err: any) {
            console.error("FATAL SEND ERROR:", err);
            alert("Network/Fatal Error sending message: " + err.message);
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
        const { success, error, data } = await saveDailyCheckIn(currentUser.id, activeStepDay, notesInput.trim() || null, selectedImageBase64, selectedImageMime || 'image/jpeg');
        if (success && data) {
            setJourneyLogs(prev => [...prev.filter(l => l.day_number !== activeStepDay), data]);
            setSelectedImageBase64(null);
            alert('Progress saved!');
        } else {
            alert(error || 'Failed to save log.');
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
          // 5 minutes = 300000 ms
          setIsJoinEnabled(meetingTime - now <= 300000);
        };
    
        checkTime();
        const interval = setInterval(checkTime, 10000); // Check every 10 seconds
    
        return () => clearInterval(interval);
    }, [nextBatchMeeting]);

    // Trial countdown
    const trialTimeLeft = React.useMemo(() => {
        if (!isTrialAccess || !trialEndDate) return null;
        const end = new Date(trialEndDate).getTime();
        const now = Date.now();
        const diff = end - now;
        if (diff <= 0) return 'Expired';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${mins}m remaining`;
    }, [isTrialAccess, trialEndDate]);

    return (
        <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background font-sans text-foreground">
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="aura-glow"></div>
            </div>

            {/* Trial Access Banner */}
            {isTrialAccess && (
                <div className="relative z-10 flex items-center justify-center gap-2 bg-secondary-container/80 backdrop-blur-md border-b border-transparent px-4 py-2 shrink-0">
                    <span className="rounded bg-background/50 px-2 py-0.5 text-xs font-bold text-secondary">TRIAL</span>
                    <p className="text-xs text-secondary">
                        You have trial access to this batch.
                        {trialTimeLeft && <span className="ml-1 font-semibold">{trialTimeLeft}</span>}
                    </p>
                </div>
            )}

            <main className="relative z-10 flex-1 overflow-hidden p-4 lg:p-6">
                <div className="mx-auto grid h-full max-w-[1800px] grid-cols-12 gap-6">

                    {/* Left Navigation col */}
                    <div className="col-span-12 flex h-full flex-col gap-4 lg:col-span-2">
                        <nav className="flex h-full flex-col gap-1 rounded-[2rem] bg-surface-container-lowest/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-outline-variant/20 backdrop-blur-[40px]">
                            <p className="mb-2 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-foreground/50">My Journey</p>

                            {/* Batch Card Status */}
                            <div className="mt-2 rounded-[1.5rem] bg-surface-container-low/50 p-4 ring-1 ring-outline-variant/10">
                                <div className="mb-3 flex items-center justify-between">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span className="rounded-full bg-surface-container-lowest px-2 py-0.5 text-[10px] font-bold text-tertiary shadow-sm">Active</span>
                                </div>
                                <h4 className="text-sm font-extrabold tracking-tight text-foreground">{activeBatch?.name || 'Classroom'}</h4>
                                <p className="mb-3 line-clamp-1 text-[11px] font-medium text-foreground/50">Instructor {activeBatch?.instructor?.full_name || 'Expert'}</p>

                                <div className="flex items-center justify-between gap-2 border-t border-outline-variant/10 pt-3">
                                    <div className="flex -space-x-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-surface bg-surface-container-low text-[9px] font-bold text-foreground">
                                            {activeBatch?.current_students || 1}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-medium tracking-tight text-foreground/60">Enrolled</span>
                                </div>
                            </div>

                            {/* Badges/Streaks */}
                            <div className="mt-auto border-t border-outline-variant/10 pt-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container/50 text-secondary">
                                        <Flame className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">Day {currentDay} Streak</h4>
                                        <p className="text-[11px] font-medium text-foreground/50">Keep it up!</p>
                                    </div>
                                </div>
                            </div>

                        </nav>
                    </div>

                    {/* Center Main col */}
                    <div className="col-span-12 flex h-full flex-col gap-6 overflow-hidden lg:col-span-7">
                        {/* Session Thumbnail */}
                        {nextBatchMeeting ? (
                            <div className="group relative w-full shrink-0 overflow-hidden rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-outline-variant/20">
                                {/* Accent top bar */}
                                <div className="absolute top-0 left-0 z-30 h-1.5 w-full bg-gradient-to-r from-primary via-primary-container to-secondary" />
                                <div className="absolute inset-0 z-10 bg-gradient-to-r from-surface-container-lowest/95 via-surface-container-lowest/70 to-surface-container-lowest/20 mix-blend-multiply" />
                                <img src="https://images.unsplash.com/photo-1512413914565-df0a876a3ff8?q=80&w=2420&auto=format&fit=crop" className="h-56 w-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Yoga Session" />
                                <div className="absolute inset-0 z-20 flex flex-row items-center justify-between gap-6 p-7 pt-8">
                                    <div className="max-w-md">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-tertiary opacity-80 shadow-[0_0_12px_var(--color-tertiary)]"></span>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground mix-blend-overlay">Upcoming Live Session</span>
                                        </div>
                                        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-surface-container-lowest drop-shadow-md">{nextBatchMeeting.topic}</h2>
                                        <div className="flex gap-3">
                                            <div className="flex items-center gap-2 rounded-2xl border border-surface-container-lowest/20 bg-surface-container-lowest/10 px-4 py-2 backdrop-blur-md">
                                                <Calendar className="h-4 w-4 text-surface-container-lowest" />
                                                <span className="text-xs font-semibold tracking-wide text-surface-container-lowest">{new Date(nextBatchMeeting.start_time).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 rounded-2xl border border-surface-container-lowest/20 bg-surface-container-lowest/10 px-4 py-2 backdrop-blur-md">
                                                <Clock className="h-4 w-4 text-surface-container-lowest" />
                                                <span className="text-xs font-semibold tracking-wide text-surface-container-lowest">{new Date(nextBatchMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        <button
                                            disabled={!isJoinEnabled}
                                            onClick={() => window.open(nextBatchMeeting.join_url, '_blank')}
                                            className={`flex h-12 items-center justify-center gap-2 rounded-full px-8 text-sm font-bold transition-all ${isJoinEnabled ? 'bg-primary text-surface-container-lowest shadow-[0_4px_24px_var(--color-primary-container)] hover:scale-105 hover:bg-primary-container active:scale-95' : 'cursor-not-allowed bg-surface-container-lowest/10 text-surface-container-lowest/50 backdrop-blur-md'}`}>
                                            {isJoinEnabled ? <><Video className="h-5 w-5" /> Join Zoom</> : 'Starts 5 min before'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="group relative flex h-48 w-full shrink-0 flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-surface-container-lowest/40 shadow-sm ring-1 ring-outline-variant/15 backdrop-blur-[40px]">
                                <Video className="mb-4 h-12 w-12 text-foreground/20" />
                                <h2 className="text-lg font-extrabold tracking-tight text-foreground/80">No Upcoming Sessions</h2>
                                <p className="text-sm font-medium text-foreground/50">Your instructor hasn't scheduled any live sessions right now.</p>
                            </div>
                        )}

                        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">

                            {/* Recorded Sessions Row */}
                            <div className="flex flex-col overflow-hidden rounded-[2rem] bg-surface-container-lowest/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-outline-variant/20 backdrop-blur-[40px]">
                                <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface/40 p-5 backdrop-blur-md">
                                    <h3 className="flex items-center gap-2 text-base font-extrabold text-foreground">
                                        <PlayCircle className="h-5 w-5 text-primary" />
                                        Catch Up on Past Sessions
                                    </h3>
                                    <span className="text-[11px] font-medium text-foreground/50">Available until batch ends</span>
                                </div>
                                <div className="flex overflow-x-auto p-5 custom-scrollbar gap-4 min-h-[100px]">
                                    {isLoadingRecordings ? (
                                        <div className="flex w-full items-center justify-center py-6">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : recordings.length === 0 ? (
                                        <p className="flex w-full items-center justify-center py-6 mx-auto text-[11px] font-medium text-foreground/50">No recorded sessions yet.</p>
                                    ) : (
                                        recordings.map((rec) => {
                                            const date = new Date(rec.start_time);
                                            const h = Math.floor(rec.duration_minutes / 60);
                                            const m = rec.duration_minutes % 60;
                                            const durationLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;
                                            return (
                                                <div key={rec.id} className="group flex h-[160px] w-[220px] min-w-[220px] flex-col rounded-[1.5rem] bg-surface-container-lowest/80 shadow-sm ring-1 ring-outline-variant/15 transition-all hover:ring-primary/50 hover:shadow-lg">
                                                    <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-t-[1.5rem] bg-surface-container-low">
                                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5">
                                                            {rec.is_available ? (
                                                                <button
                                                                    onClick={() => window.open(rec.play_url!, '_blank')}
                                                                    className="flex items-center gap-2 rounded-full bg-surface-container-lowest/90 px-4 py-2 text-xs font-bold text-primary shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all hover:scale-105 hover:bg-surface-container-lowest backdrop-blur-md"
                                                                >
                                                                    <PlayCircle className="h-4 w-4" /> Watch
                                                                </button>
                                                            ) : (
                                                                <span className="rounded-full bg-surface-container-lowest/50 px-3 py-1.5 text-[10px] font-bold text-foreground backdrop-blur-md">Processing…</span>
                                                            )}
                                                        </div>
                                                        <div className="absolute bottom-2 right-2 z-20 rounded-md bg-foreground/80 px-2 py-0.5 text-[10px] font-bold tracking-wider text-surface-container-lowest backdrop-blur-md">{durationLabel}</div>
                                                    </div>
                                                    <div className="flex flex-1 flex-col justify-center p-3">
                                                        <div className="mb-1 flex items-center justify-between">
                                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary">Recording</span>
                                                            <span className="text-[10px] font-medium text-foreground/50">{date.toLocaleDateString()}</span>
                                                        </div>
                                                        <h4 className="line-clamp-1 text-sm font-bold text-foreground">{rec.topic}</h4>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Transformation Journey and Resources Row Grid */}
                            <div className="grid grid-cols-12 gap-6">

                                {/* Transformation Journey */}
                                <div className="col-span-12 flex flex-col rounded-[2rem] bg-surface-container-lowest/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-outline-variant/20 backdrop-blur-[40px] xl:col-span-7">
                                    <div className="border-b border-outline-variant/10 bg-surface/40 p-5 backdrop-blur-md">
                                        <h3 className="flex items-center gap-2 text-base font-extrabold text-foreground">
                                            <Star className="h-5 w-5 text-primary" />
                                            Transformation Journey - Day {currentDay}
                                        </h3>
                                    </div>
                                    <div className="flex-1 p-5 flex flex-col gap-8">
                                        <div className="rounded-[1.5rem] bg-surface-container-lowest/80 p-6 shadow-sm ring-1 ring-outline-variant/15 backdrop-blur-md">
                                            <JourneyProgress 
                                                currentDay={currentDay}
                                                activeDay={activeStepDay}
                                                onSelectDay={setActiveStepDay}
                                                completedDays={new Set(journeyLogs.map(l => l.day_number))}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="rounded-[1.5rem] overflow-hidden ring-1 ring-outline-variant/15 shadow-[0_8px_24px_rgba(0,0,0,0.06)] bg-surface-container-low aspect-[4/3] relative">
                                                {activeStepDay === 25 && afterImage ? (
                                                    <ImageComparison beforeImage={beforeImage} afterImage={afterImage as string} altBefore="Day 1" altAfter={`Day 25`} />
                                                ) : (
                                                    <img src={activeLog?.photo_url || (activeStepDay === 25 ? (afterImage as string ?? beforeImage) : beforeImage)} alt={`Day ${activeStepDay}`} className="w-full h-full object-cover transition-opacity duration-500" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-4 justify-center items-center">
                                                {(activeStepDay === 1 || activeStepDay === 25) && (
                                                    <div className="flex flex-col gap-3 w-full max-w-[220px]">
                                                        <p className="text-xs font-semibold uppercase tracking-widest text-center text-foreground/60 mb-1">Day {activeStepDay} Snapshot</p>
                                                        <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />
                                                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center w-full gap-2 rounded-xl bg-surface-container-lowest/80 px-4 py-3 text-sm font-extrabold text-foreground shadow-sm ring-1 ring-outline-variant/20 transition-all hover:scale-105 hover:bg-surface-container-lowest">
                                                            <Camera className="h-4 w-4 text-primary" /> Select Photo
                                                        </button>
                                                        {selectedImageBase64 && (
                                                            <button onClick={handleSaveLog} disabled={isSavingLog} className="flex mt-2 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-extrabold text-surface-container-lowest shadow-[0_8px_16px_var(--color-primary-container)] transition-all hover:scale-105 hover:bg-primary-container disabled:opacity-50 disabled:hover:scale-100">
                                                                {isSavingLog ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Save Day {activeStepDay}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                {activeStepDay !== 1 && activeStepDay !== JOURNEY_MAX_DAY && (
                                                    <p className="text-[11px] font-medium text-center text-foreground/40 leading-relaxed max-w-[200px]">Photo upload required only on Day 1 and Day {JOURNEY_MAX_DAY}. Continue your breathing routines.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Resources Feed */}
                                <div className="col-span-12 flex flex-col rounded-[2rem] bg-surface-container-lowest/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-outline-variant/20 backdrop-blur-[40px] xl:col-span-5 relative">
                                    <div className="border-b border-outline-variant/10 bg-surface/40 p-5 backdrop-blur-md">
                                        <h3 className="flex items-center gap-2 text-base font-extrabold text-foreground">
                                            <FileText className="h-5 w-5 text-primary" />
                                            Sanctuary Library
                                        </h3>
                                    </div>
                                    <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[350px] custom-scrollbar">
                                        {initialResources.map((res: any) => (
                                            <div key={res.id} onClick={() => window.open(res.file_url, '_blank')} className="group flex cursor-pointer items-center justify-between gap-4 rounded-[1.25rem] bg-surface-container-lowest/80 p-3 shadow-sm ring-1 ring-outline-variant/15 backdrop-blur-md transition-all hover:scale-[1.02] hover:ring-primary/40">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container/50 text-secondary shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)]">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-foreground line-clamp-1">{res.title || res.file_name}</h4>
                                                        <p className="text-[11px] font-medium text-foreground/50">{new Date(res.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); window.open(res.file_url, '_blank'); }}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-foreground/50 transition-colors hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {initialResources.length === 0 && (
                                            <div className="flex h-full min-h-[150px] flex-col items-center justify-center opacity-60">
                                                <FileText className="mb-2 h-8 w-8 text-foreground/20" />
                                                <p className="text-center text-[11px] font-medium text-foreground/50">Your sanctuary is empty. Resources will appear here.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Right Chat col */}
                    <div className="col-span-12 h-[600px] lg:sticky lg:top-6 lg:col-span-3 lg:h-[calc(100vh-3rem)]">
                        <div className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-surface-container-lowest/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-outline-variant/20 backdrop-blur-[40px]">
                            <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface/40 px-5 py-4 backdrop-blur-md">
                                <div>
                                    <h3 className="flex items-center gap-2 text-base font-extrabold text-foreground">
                                        Batch Chat
                                    </h3>
                                    <p className="text-[11px] font-medium text-foreground/50">24 Online</p>
                                </div>
                            </div>

                            <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar">
                                {messages.map((msg) => {
                                    const senderProfile = msg.sender || msg.profiles || msg.senderProfile || {};
                                    const isPoll = msg.message_type === 'poll' && msg.poll_id;
                                    const poll = isPoll ? polls[msg.poll_id] : null;

                                    return (
                                        <div key={msg.id} className={`flex gap-3 ${msg.sender_id === currentUser.id ? 'flex-row-reverse' : ''}`}>
                                            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-secondary-container ring-2 ring-surface-container-lowest shadow-sm">
                                                {senderProfile?.avatar_url ? (
                                                    <img src={senderProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-secondary">
                                                        {(senderProfile?.full_name || 'U').charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`flex max-w-[85%] flex-col ${msg.sender_id === currentUser.id ? 'items-end' : ''}`}>
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-foreground">{senderProfile?.full_name || 'User'}</span>
                                                    <span className="text-[9px] font-medium text-foreground/50">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {msg.sender_id === activeBatch?.instructor_id ? (
                                                        <span className="flex items-center gap-1 rounded-full bg-secondary-container/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-secondary ring-1 ring-secondary-container">Instructor <CheckCircle className="h-2 w-2" /></span>
                                                    ) : msg.sender_id !== currentUser.id ? (
                                                        <span className="flex items-center gap-1 rounded-full bg-surface-container-high px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-foreground/50 ring-1 ring-outline-variant/10">Student</span>
                                                    ) : null}
                                                </div>
                                                {isPoll ? (
                                                    poll ? (
                                                        <PollCard
                                                            poll={poll}
                                                            isAdmin={false}
                                                            onVote={(optionId) => handleVotePoll(poll.id, optionId)}
                                                            isVoting={votingPollId === poll.id}
                                                        />
                                                    ) : (
                                                        <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-xs font-medium text-foreground/50 shadow-sm ring-1 ring-outline-variant/10">Loading poll…</div>
                                                    )
                                                ) : (
                                                    <div className={`rounded-[1.5rem] px-4 py-3 text-[13px] leading-relaxed shadow-sm ring-1 ${msg.sender_id === currentUser.id ? 'rounded-tr-sm bg-primary text-surface-container-lowest ring-transparent shadow-[0_4px_16px_var(--color-primary-container)]' : msg.sender_id === activeBatch?.instructor_id ? 'rounded-tl-sm bg-secondary-container/30 text-foreground ring-secondary/20' : 'rounded-tl-sm bg-surface-container-lowest/80 text-foreground ring-outline-variant/10 backdrop-blur-sm'}`}>
                                                        <p>{msg.content}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t border-outline-variant/10 bg-surface/60 p-4 backdrop-blur-md">
                                {isChatEnabled ? (
                                    <div className="relative flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Say something to the batch..."
                                            className="w-full rounded-[1.5rem] bg-surface-container-lowest/90 border-0 p-3.5 pr-12 text-[13px] font-medium text-foreground shadow-sm ring-1 ring-outline-variant/20 placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all backdrop-blur-md"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-surface-container-lowest shadow-sm transition-all hover:scale-105 hover:bg-primary-container"
                                        >
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="rounded-xl bg-surface-container-low p-3 text-center text-xs font-semibold text-foreground/50 ring-1 ring-outline-variant/10">
                                        Chat is currently disabled by the instructor.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
