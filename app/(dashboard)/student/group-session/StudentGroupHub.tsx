'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    Calendar, Users, Star,
    Flame, PlayCircle, FileText, Download, CheckCircle, Send, Camera,
    Video, Clock, Sparkles, ChevronRight, Play, ShieldCheck
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
    const supabase = createClient();

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
    const day25Log = journeyLogs.find(l => l.day_number === 25);
    const beforeImage = day1Log?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
    let afterImage = day25Log?.photo_url || selectedImageBase64 || null;

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

                    if (payload.new.message_type === 'poll' && payload.new.poll_id) {
                        const pollData = await getPollById(payload.new.poll_id, currentUser.id);
                        if (pollData) setPolls(prev => ({ ...prev, [pollData.id]: pollData }));
                    }
                }
            )
            .subscribe();

        const voteChannel = supabase
            .channel(`student-votes-${activeBatch.id}`)
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

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background animate-in fade-in duration-1000">
            
            {/* Background elements */}
            <div className="fixed top-0 right-0 w-[50vw] h-[50vh] bg-primary/2 rounded-full blur-[120px] -z-10" />

            {/* Trial Access Banner */}
            {isTrialAccess && (
                <div className="relative z-10 flex items-center justify-center gap-2 bg-foreground text-background px-4 py-1.5 shrink-0 text-[10px] font-bold uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Trial Access Active: {trialEndDate && <span>{new Date(trialEndDate).toLocaleDateString()}</span>}
                </div>
            )}

            <main className="flex-1 flex overflow-hidden lg:p-10 gap-8">
                
                {/* ── LEFT RAIL: Batch Meta ── */}
                <div className="hidden lg:flex w-80 flex-col gap-8 shrink-0">
                    <div className="surface-container p-8 rounded-3xl flex flex-col gap-8 border border-outline-variant/10 h-min bg-white/50 backdrop-blur-xl shadow-sm">
                        <div className="space-y-1.5">
                           <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                              <Users className="w-5 h-5" />
                           </div>
                           <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight">{activeBatch?.name || 'Your Batch'}</h2>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 italic">Collective Growth</p>
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

                        <div className="pt-6 border-t border-outline-variant/5 flex items-center gap-2">
                           <div className="h-2 w-2 rounded-full bg-brand-emerald shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                           <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">{activeBatch?.current_students || 1} Students Active</span>
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
                                    <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest mt-0.5">Download Artifact</p>
                                 </div>
                              </button>
                           ))}
                           {initialResources.length === 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/20 text-center py-12 opacity-50">Awaiting artifacts...</p>}
                        </div>
                    </div>
                </div>

                {/* ── CENTER: Focus Area ── */}
                <div className="flex-1 flex flex-col gap-8 overflow-hidden">
                    
                    {/* Live Section */}
                    {nextBatchMeeting ? (
                        <div className="group relative w-full h-80 rounded-3xl overflow-hidden shadow-xl border border-outline-variant/10 bg-black">
                            <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2420&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 transition-transform duration-[2000ms] group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            
                            <div className="absolute top-8 left-8 z-20">
                               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                  Session Upcoming
                               </div>
                            </div>

                            <div className="absolute inset-x-8 bottom-8 z-20 flex items-end justify-between gap-10">
                               <div className="space-y-3 max-w-xl">
                                  <h2 className="text-4xl font-serif font-bold text-white tracking-tight leading-tight">{nextBatchMeeting.topic}</h2>
                                  <div className="flex gap-4">
                                     <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest">
                                        <Calendar className="w-3.5 h-3.5" /> {new Date(nextBatchMeeting.start_time).toLocaleDateString()}
                                     </div>
                                     <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest">
                                        <Clock className="w-3.5 h-3.5" /> {new Date(nextBatchMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </div>
                                  </div>
                               </div>
                               <button
                                   disabled={!isJoinEnabled}
                                   onClick={() => window.open(nextBatchMeeting.join_url, '_blank')}
                                   className={cn(
                                       "h-16 px-10 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-3",
                                       isJoinEnabled 
                                          ? "bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg" 
                                          : "bg-white/10 text-white/20 backdrop-blur-md border border-white/10 cursor-not-allowed"
                                   )}
                               >
                                   {isJoinEnabled ? <><Play className="w-4 h-4 fill-current" /> Enter Presence</> : 'Patience'}
                               </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-32 surface-container rounded-3xl border border-outline-variant/10 flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur-xl shrink-0 opacity-50">
                           <Video className="w-6 h-6 text-foreground/20" />
                           <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/20">No active transmissions</p>
                        </div>
                    )}

                    {/* Journey Rail */}
                    <div className="surface-container p-8 rounded-3xl border border-outline-variant/10 flex flex-col gap-10 overflow-hidden bg-white/50 backdrop-blur-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-serif font-bold text-foreground tracking-tight">Your Journey – Day {currentDay}</h3>
                            <JourneyProgress 
                                currentDay={currentDay}
                                activeDay={activeStepDay}
                                onSelectDay={setActiveStepDay}
                                completedDays={new Set(journeyLogs.map(l => l.day_number))}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            <div className="relative aspect-video rounded-3xl overflow-hidden border border-outline-variant/10 shadow-lg bg-surface-container-highest">
                                {activeStepDay === 25 && afterImage ? (
                                    <ImageComparison beforeImage={beforeImage} afterImage={afterImage as string} altBefore="Origin" altAfter="Transcendence" />
                                ) : (
                                    <img src={activeLog?.photo_url || (activeStepDay === 25 ? (afterImage as string ?? beforeImage) : beforeImage)} alt={`Day ${activeStepDay}`} className="w-full h-full object-cover animate-in fade-in duration-700" />
                                )}
                                <div className="absolute top-4 left-4 z-10">
                                   <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-bold text-white uppercase tracking-widest border border-white/10">
                                      Chronicle {activeStepDay}
                                   </div>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                               <div className="space-y-2">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Daily Snapshot</h4>
                                  <p className="text-sm text-foreground/40 font-medium leading-relaxed italic">Capture your essence at critical nodes of transcendence. Required on Day 1 and 25.</p>
                               </div>

                               {(activeStepDay === 1 || activeStepDay === 25) ? (
                                   <div className="flex flex-col gap-3">
                                       <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />
                                       <button onClick={() => fileInputRef.current?.click()} className="h-14 w-full rounded-2xl bg-white border border-outline-variant/10 shadow-sm flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:border-primary/20 hover:scale-[1.01] transition-all">
                                           <Camera className="w-4 h-4 text-primary" /> Select Source
                                       </button>
                                       {selectedImageBase64 && (
                                           <button onClick={handleSaveLog} disabled={isSavingLog} className="h-14 w-full rounded-2xl bg-foreground text-background shadow-lg flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all">
                                               {isSavingLog ? <Loader2 className="w-4 h-4 animate-spin text-background" /> : <ShieldCheck className="w-4 h-4" />} Commit Archive
                                           </button>
                                       )}
                                   </div>
                               ) : (
                                   <div className="h-32 rounded-2xl border border-dashed border-outline-variant/20 flex flex-col items-center justify-center p-6 text-center opacity-40 bg-foreground/[0.02]">
                                      <Sparkles className="w-5 h-5 text-foreground/20 mb-3" />
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/20 leading-relaxed">Observe & Breathe. The next archive window opens at node 25.</p>
                                   </div>
                               )}
                            </div>
                        </div>
                    </div>

                    {/* Recordings Suite */}
                    <div className="surface-container rounded-3xl border border-outline-variant/10 flex flex-col overflow-hidden bg-white/50 backdrop-blur-xl shadow-sm">
                        <div className="p-8 border-b border-outline-variant/5 flex items-center justify-between">
                           <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Past Transmissions</h3>
                           <PlayCircle className="w-4 h-4 text-foreground/10" />
                        </div>
                        <div className="flex overflow-x-auto p-8 gap-6 custom-scrollbar">
                           {recordings.map((rec) => (
                              <div key={rec.id} className="min-w-[280px] w-[280px] flex flex-col bg-white border border-outline-variant/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01] transition-all group">
                                 <div className="aspect-video relative overflow-hidden bg-foreground/[0.02]">
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                       {rec.is_available ? (
                                          <button onClick={() => window.open(rec.play_url!, '_blank')} className="h-10 w-10 rounded-full bg-white text-black shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                             <Play className="w-4 h-4 fill-current ml-0.5" />
                                          </button>
                                       ) : (
                                          <div className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">Processing</div>
                                       )}
                                    </div>
                                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-bold text-white/90 uppercase tracking-widest">
                                       {rec.duration_minutes}m
                                    </div>
                                 </div>
                                 <div className="p-5 space-y-1.5">
                                    <p className="text-[9px] font-bold text-primary uppercase tracking-widest">{new Date(rec.start_time).toLocaleDateString()}</p>
                                    <h4 className="text-sm font-bold text-foreground leading-tight truncate">{rec.topic}</h4>
                                 </div>
                              </div>
                           ))}
                           {recordings.length === 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/20 py-12 w-full text-center opacity-50">No recorded echoes yet.</p>}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT RAIL: Communion ── */}
                <div className="hidden xl:flex w-96 flex-col gap-6 shrink-0 h-full">
                    <div className="surface-container rounded-3xl border border-outline-variant/10 h-full flex flex-col overflow-hidden bg-white/50 backdrop-blur-xl shadow-sm">
                        <div className="p-8 border-b border-outline-variant/5 flex flex-col gap-1.5">
                           <div className="flex items-center justify-between">
                              <h3 className="text-2xl font-serif font-bold tracking-tight text-foreground">Group Chat</h3>
                              <div className="h-2 w-2 rounded-full bg-primary/40" />
                           </div>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 italic">Collective Energy Stream</p>
                        </div>

                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                           {messages.map((msg) => {
                               const sender = msg.sender || msg.profiles || msg.senderProfile || {};
                               const isOwn = msg.sender_id === currentUser.id;
                               const isPoll = msg.message_type === 'poll';
                               const poll = isPoll ? polls[msg.poll_id] : null;

                               return (
                                  <div key={msg.id} className={cn("flex flex-col gap-1.5", isOwn ? "items-end" : "items-start")}>
                                     {!isOwn && (
                                        <div className="flex items-center gap-2 mb-0.5">
                                           <div className="h-6 w-6 rounded-lg overflow-hidden border border-outline-variant/10 bg-white">
                                              {sender.avatar_url ? <img src={sender.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-foreground/20 bg-foreground/5">{(sender.full_name || 'U').charAt(0).toUpperCase()}</div>}
                                           </div>
                                           <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">{sender.full_name}</p>
                                           {msg.sender_id === activeBatch?.instructor_id && <ShieldCheck className="w-3 h-3 text-primary/60" />}
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

                        <div className="p-8 border-t border-outline-variant/10 bg-white/40 backdrop-blur-md">
                           {isChatEnabled ? (
                              <div className="relative group">
                                 <input
                                     type="text"
                                     value={newMessage}
                                     onChange={(e) => setNewMessage(e.target.value)}
                                     onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                     placeholder="Resonate with others..."
                                     className="w-full h-12 pl-5 pr-12 rounded-xl bg-white border border-outline-variant/10 text-[13px] text-foreground font-medium placeholder:text-foreground/20 focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all shadow-sm group-hover:border-primary/20"
                                 />
                                 <button onClick={handleSendMessage} className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                                    <Send className="w-3.5 h-3.5" />
                                 </button>
                              </div>
                           ) : (
                              <div className="h-12 rounded-xl bg-foreground/5 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-foreground/20">Quietude Enabled</div>
                           )}
                        </div>
                    </div>
                </div>

            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}
