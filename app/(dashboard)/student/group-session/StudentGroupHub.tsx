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
        <div className="flex h-full flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-50 via-gray-50 to-white text-gray-900">

            {/* Trial Access Banner */}
            {isTrialAccess && (
                <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 shrink-0">
                    <span className="rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-bold text-amber-700">TRIAL</span>
                    <p className="text-xs text-amber-700">
                        You have trial access to this batch.
                        {trialTimeLeft && <span className="ml-1 font-semibold">{trialTimeLeft}</span>}
                    </p>
                </div>
            )}

            <main className="relative z-0 flex-1 overflow-hidden p-4">
                <div className="mx-auto grid h-full max-w-[1800px] grid-cols-12 gap-4">

                    {/* Left Navigation col */}
                    <div className="col-span-12 flex h-full flex-col gap-4 lg:col-span-2">
                        <nav className="flex h-full flex-col gap-1 rounded-xl border border-white/60 bg-white/65 p-3 shadow-sm backdrop-blur-md">
                            <p className="mb-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 opacity-70">My Journey</p>

                            {/* Batch Card Status */}
                            <div className="mt-2 rounded-lg border border-pink-100/50 bg-gradient-to-br from-pink-50 to-pink-100/50 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <Users className="h-4 w-4 text-pink-500" />
                                    <span className="rounded-full border border-green-200 bg-white/60 px-1.5 py-0.5 text-[10px] font-bold text-green-600">Active</span>
                                </div>
                                <h4 className="text-xs font-bold text-gray-900">{activeBatch?.name || 'Classroom'}</h4>
                                <p className="mb-2 line-clamp-1 text-[10px] text-gray-500">Instructor {activeBatch?.instructor?.full_name || 'Expert'}</p>

                                <div className="mt-3 flex items-center justify-between gap-2 border-t border-pink-100/50 pt-3">
                                    <div className="flex -space-x-2">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-pink-100 text-[8px] font-bold text-pink-600">
                                            {activeBatch?.current_students || 1}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-medium text-pink-600 tracking-tight">Enrolled</span>
                                </div>
                            </div>

                            {/* Badges/Streaks */}
                            <div className="mt-auto border-t border-pink-100/50 pt-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                                        <Flame className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900">Day {currentDay} Streak</h4>
                                        <p className="text-[10px] text-gray-500">Keep it up!</p>
                                    </div>
                                </div>
                            </div>

                        </nav>
                    </div>

                    {/* Center Main col */}
                    <div className="col-span-12 flex h-full flex-col gap-4 overflow-hidden lg:col-span-7">
                        {/* Session Thumbnail */}
                        {nextBatchMeeting ? (
                            <div className="group relative w-full shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
                                {/* Accent top bar */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 z-30" />
                                <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                                <img src="https://images.unsplash.com/photo-1512413914565-df0a876a3ff8?q=80&w=2420&auto=format&fit=crop" className="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Yoga Session" />
                                <div className="absolute inset-0 z-20 flex flex-row items-center justify-between gap-4 p-5 pt-6">
                                    <div className="max-w-md">
                                        <div className="mb-1.5 flex items-center gap-2">
                                            <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-green-400">Upcoming Live Session</span>
                                        </div>
                                        <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-white">{nextBatchMeeting.topic}</h2>
                                        <div className="flex gap-3">
                                            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
                                                <Calendar className="h-3.5 w-3.5 text-pink-300" />
                                                <span className="text-xs font-medium text-white">{new Date(nextBatchMeeting.start_time).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
                                                <Clock className="h-3.5 w-3.5 text-pink-300" />
                                                <span className="text-xs font-medium text-white">{new Date(nextBatchMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        <button
                                            disabled={!isJoinEnabled}
                                            onClick={() => window.open(nextBatchMeeting.join_url, '_blank')}
                                            className={`flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${isJoinEnabled ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_4px_14px_0_rgba(236,72,153,0.5)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.4)] hover:scale-105 active:scale-95' : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'}`}>
                                            {isJoinEnabled ? <><Video className="h-5 w-5" /> Join Zoom</> : 'Starts 5 min before'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="group relative w-full h-48 shrink-0 overflow-hidden rounded-2xl border border-white/20 shadow-sm bg-gray-50 flex flex-col items-center justify-center">
                                <Video className="h-10 w-10 text-gray-300 mb-3" />
                                <h2 className="text-lg font-bold tracking-tight text-gray-600">No Upcoming Sessions</h2>
                                <p className="text-sm font-medium text-gray-400">Your instructor hasn't scheduled any live sessions right now.</p>
                            </div>
                        )}

                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">

                            {/* Recorded Sessions Row */}
                            <div className="flex flex-col overflow-hidden rounded-xl border border-white/60 bg-white/65 shadow-sm backdrop-blur-md">
                                <div className="flex items-center justify-between border-b border-pink-50 bg-white/40 p-3">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                        <PlayCircle className="h-4 w-4 text-pink-500" />
                                        Catch Up on Past Sessions
                                    </h3>
                                    <span className="text-[10px] text-gray-400">Available until batch ends</span>
                                </div>
                                <div className="flex overflow-x-auto p-4 custom-scrollbar gap-4 min-h-[80px]">
                                    {isLoadingRecordings ? (
                                        <div className="flex w-full items-center justify-center py-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-pink-400" />
                                        </div>
                                    ) : recordings.length === 0 ? (
                                        <p className="flex w-full items-center justify-center text-[10px] text-gray-400 py-4">No recorded sessions yet.</p>
                                    ) : (
                                        recordings.map((rec) => {
                                            const date = new Date(rec.start_time);
                                            const h = Math.floor(rec.duration_minutes / 60);
                                            const m = rec.duration_minutes % 60;
                                            const durationLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;
                                            return (
                                                <div key={rec.id} className="group flex h-[140px] w-[200px] min-w-[200px] flex-col rounded-lg border border-pink-100 bg-white/60 shadow-sm transition-all hover:border-pink-300">
                                                    <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-t-lg bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200">
                                                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                                                            {rec.is_available ? (
                                                                <button
                                                                    onClick={() => window.open(rec.play_url!, '_blank')}
                                                                    className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold text-pink-600 shadow-md transition-all hover:bg-white hover:scale-105"
                                                                >
                                                                    <PlayCircle className="h-3.5 w-3.5" /> Watch
                                                                </button>
                                                            ) : (
                                                                <span className="rounded-full bg-black/40 px-2.5 py-1 text-[9px] font-bold text-white">Processing…</span>
                                                            )}
                                                        </div>
                                                        <div className="absolute bottom-2 right-2 z-20 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">{durationLabel}</div>
                                                    </div>
                                                    <div className="flex flex-1 flex-col justify-center p-2">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="text-[9px] font-bold text-pink-500">Recording</span>
                                                            <span className="text-[9px] text-gray-500">{date.toLocaleDateString()}</span>
                                                        </div>
                                                        <h4 className="line-clamp-1 text-xs font-bold text-gray-900">{rec.topic}</h4>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Transformation Journey and Resources Row Grid */}
                            <div className="grid grid-cols-12 gap-4">

                                {/* Transformation Journey */}
                                <div className="col-span-12 flex flex-col rounded-xl border border-white/60 bg-white/65 shadow-sm backdrop-blur-md xl:col-span-7">
                                    <div className="border-b border-pink-50 bg-white/40 p-3">
                                        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                            <Star className="h-4 w-4 text-pink-500" />
                                            Transformation Journey - Day {currentDay}
                                        </h3>
                                    </div>
                                    <div className="flex-1 p-4 flex flex-col gap-6">
                                        <div className="rounded-2xl bg-white/50 p-6 ring-1 ring-black/5">
                                            <JourneyProgress 
                                                currentDay={currentDay}
                                                activeDay={activeStepDay}
                                                onSelectDay={setActiveStepDay}
                                                completedDays={new Set(journeyLogs.map(l => l.day_number))}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="rounded-xl overflow-hidden ring-1 ring-black/5 shadow-md bg-white aspect-[4/3]">
                                                {activeStepDay === 25 && afterImage ? (
                                                    <ImageComparison beforeImage={beforeImage} afterImage={afterImage} altBefore="Day 1" altAfter={`Day 25`} />
                                                ) : (
                                                    <img src={activeLog?.photo_url || (activeStepDay === 25 ? (afterImage ?? beforeImage) : beforeImage)} alt={`Day ${activeStepDay}`} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-3 justify-center items-center">
                                                {(activeStepDay === 1 || activeStepDay === 25) && (
                                                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                                                        <p className="text-xs text-center text-gray-600 mb-2">Upload your Day {activeStepDay} photo</p>
                                                        <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />
                                                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center w-full gap-1 rounded-lg border border-pink-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-pink-50">
                                                            <Camera className="h-4 w-4 text-pink-500" /> Choose Photo
                                                        </button>
                                                        {selectedImageBase64 && (
                                                            <button onClick={handleSaveLog} disabled={isSavingLog} className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-500 py-2 text-xs font-bold text-white shadow-md hover:bg-pink-600 disabled:opacity-50 mt-2">
                                                                {isSavingLog ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Save Day {activeStepDay} Photo
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                {activeStepDay !== 1 && activeStepDay !== JOURNEY_MAX_DAY && (
                                                    <p className="text-xs text-center text-gray-500">Photo uploads are only required on Day 1 and Day {JOURNEY_MAX_DAY}.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Resources Feed */}
                                <div className="col-span-12 flex flex-col rounded-xl border border-white/60 bg-white/65 shadow-sm backdrop-blur-md xl:col-span-5 relative">
                                    <div className="border-b border-pink-50 bg-white/40 p-3">
                                        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                            <FileText className="h-4 w-4 text-pink-500" />
                                            Session Handouts
                                        </h3>
                                    </div>
                                    <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar">
                                        {initialResources.map((res: any) => (
                                            <div key={res.id} onClick={() => window.open(res.file_url, '_blank')} className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-pink-100 bg-white/60 p-2.5 transition-all hover:border-pink-300 hover:shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded border border-red-100 bg-red-50 text-red-500 shadow-sm">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{res.title || res.file_name}</h4>
                                                        <p className="text-[9px] text-gray-500">{new Date(res.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); window.open(res.file_url, '_blank'); }}
                                                    className="rounded p-1 text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-600"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {initialResources.length === 0 && (
                                            <p className="text-center text-[10px] text-gray-400 py-10">No resources shared yet.</p>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Right Chat col */}
                    <div className="col-span-12 h-[600px] lg:sticky lg:top-6 lg:col-span-3 lg:h-[calc(100vh-6rem)]">
                        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/60 bg-white/65 shadow-sm backdrop-blur-md">
                            <div className="flex items-center justify-between border-b border-pink-50 bg-white/40 px-3 py-3 backdrop-blur-sm">
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                        Batch Chat
                                    </h3>
                                    <p className="text-[10px] text-gray-500">24 Online</p>
                                </div>
                            </div>

                            <div ref={chatContainerRef} className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-white/30 to-white/10 p-3 custom-scrollbar">
                                {messages.map((msg) => {
                                    const senderProfile = msg.sender || msg.profiles || msg.senderProfile || {};
                                    const isPoll = msg.message_type === 'poll' && msg.poll_id;
                                    const poll = isPoll ? polls[msg.poll_id] : null;

                                    return (
                                        <div key={msg.id} className={`flex gap-2 ${msg.sender_id === currentUser.id ? 'flex-row-reverse' : ''}`}>
                                            <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-pink-200">
                                                {senderProfile?.avatar_url ? (
                                                    <img src={senderProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-pink-600">
                                                        {(senderProfile?.full_name || 'U').charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`flex max-w-[90%] flex-col ${msg.sender_id === currentUser.id ? 'items-end' : ''}`}>
                                                <div className="mb-0.5 flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-900">{senderProfile?.full_name || 'User'}</span>
                                                    <span className="text-[9px] text-gray-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {msg.sender_id === activeBatch?.instructor_id ? (
                                                        <span className="flex items-center gap-0.5 rounded border border-pink-200 bg-pink-50 px-1 text-[9px] font-bold text-pink-500">Instructor <CheckCircle className="h-2 w-2" /></span>
                                                    ) : msg.sender_id !== currentUser.id ? (
                                                        <span className="flex items-center gap-0.5 rounded border border-gray-200 bg-gray-50 px-1 text-[8px] font-bold text-gray-500">Student</span>
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
                                                        <div className="rounded-xl border border-pink-100 bg-pink-50 px-3 py-2 text-xs text-gray-400">Loading poll…</div>
                                                    )
                                                ) : (
                                                    <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${msg.sender_id === currentUser.id ? 'rounded-tr-none bg-pink-500 text-white' : msg.sender_id === activeBatch?.instructor_id ? 'rounded-tl-none border border-pink-300 bg-pink-50 text-gray-900 shadow-pink-100' : 'rounded-tl-none border border-white/50 bg-white text-gray-900'}`}>
                                                        <p>{msg.content}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t border-pink-50 bg-white/60 p-3">
                                {isChatEnabled ? (
                                    <div className="relative flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Say something to the batch..."
                                            className="w-full rounded-lg border-pink-200 bg-white p-2.5 pr-10 text-xs shadow-inner focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            className="absolute right-1 rounded p-1.5 text-pink-500 transition-colors hover:bg-pink-100"
                                        >
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="rounded-lg bg-gray-50 p-2 text-center text-xs font-medium text-gray-500 border border-gray-100">
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
