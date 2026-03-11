'use client';
import { useState, useEffect, useRef } from 'react';
// Force re-indexing of this client component for module resolution stability
import {
    Search, Bell, Plus, Play, Calendar, GraduationCap, Check,
    Award, Users, User, Star, Settings, AlertTriangle,
    Flame, PlayCircle, FileText, Download, CheckCircle, Send, Camera, Image as ImageIcon
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '../../../../lib/supabase/client';
import { getBatchMessages, sendBatchMessage } from '../../../../lib/actions/chat';
import { getJourneyLogs, saveDailyCheckIn, type JourneyLog } from '../../../../lib/actions/journey';
import { ImageComparison } from '../../../../components/ui/image-comparison-slider';
import {
    Stepper,
    StepperIndicator,
    StepperItem,
    StepperNav,
    StepperSeparator,
    StepperTrigger,
} from '../../../../components/ui/stepper';

import type { Profile, Batch } from '../../../../types/database';

interface StudentGroupClientProps {
    currentUser: Profile;
    activeBatch: any; // Using any for flexibility with joined data
    initialResources: any[];
}

const MILESTONE_DAYS = [1, 7, 14, 21, 30];

export function StudentGroupHub({ currentUser, activeBatch, initialResources }: StudentGroupClientProps) {
    const [isChatEnabled, setIsChatEnabled] = useState(activeBatch?.is_chat_enabled ?? true);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

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
    const beforeImage = day1Log?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
    let afterImage = activeLog?.photo_url || selectedImageBase64 || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800';

    if (!activeLog?.photo_url && !selectedImageBase64) {
        const logsWithPhotos = [...journeyLogs].filter(l => l.photo_url).sort((a, b) => b.day_number - a.day_number);
        if (logsWithPhotos.length > 0) {
            afterImage = logsWithPhotos[0].photo_url as string;
        }
    }

    useEffect(() => {
        if (!activeBatch?.id) return;

        const init = async () => {
            const msgs = await getBatchMessages(activeBatch.id);
            setMessages(msgs);
            const logs = await getJourneyLogs(currentUser.id);
            setJourneyLogs(logs);
            if (logs.length > 0) {
                const latestDay = [...logs].sort((a, b) => b.day_number - a.day_number)[0].day_number;
                setActiveStepDay(latestDay);
            }
        };
        init();

        const channel = supabase
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
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
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

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-50 via-gray-50 to-white text-gray-900">

            {/* Top Header Placeholder */}
            <div className="flex items-center justify-between border-b border-pink-100 bg-white/70 px-6 py-3 shadow-sm backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-2 text-pink-500">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md">
                        <span className="material-symbols-outlined text-[18px]">self_improvement</span>
                    </div>
                    <h2 className="text-lg font-bold tracking-tight text-gray-900">FaceYoguez</h2>
                </div>

                <div className="flex items-center gap-4">
                    {/* Header items */}
                    <p className="hidden text-right sm:block">
                        <span className="block text-xs font-bold leading-tight text-gray-900">{currentUser?.full_name || 'Student'}</span>
                        <span className="block text-[10px] font-medium leading-tight text-pink-500">Face Yoga Practitioner</span>
                    </p>
                    {currentUser?.avatar_url ? (
                        <img src={currentUser.avatar_url} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm" />
                    ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white shadow-sm">
                            {currentUser?.full_name?.charAt(0) || 'S'}
                        </div>
                    )}
                </div>
            </div>

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
                                        <h4 className="text-xs font-bold text-gray-900">12 Day Streak</h4>
                                        <p className="text-[10px] text-gray-500">Keep it up!</p>
                                    </div>
                                </div>
                            </div>

                            {/* Daily Reflection */}
                            <div className="mt-4 border-t border-pink-100/50 pt-4">
                                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 opacity-70">Daily Reflection</p>
                                <div className="px-3">
                                    <textarea
                                        placeholder="How are you feeling about your practice today?"
                                        className="w-full h-24 rounded-lg border border-pink-100 bg-white/50 p-2 text-xs outline-none focus:ring-1 focus:ring-pink-500 resize-none"
                                        value={notesInput}
                                        onChange={(e) => setNotesInput(e.target.value)}
                                    />
                                    <button
                                        onClick={handleSaveLog}
                                        disabled={isSavingLog}
                                        className="mt-2 w-full rounded-md bg-pink-500 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-pink-600 transition-colors"
                                    >
                                        Save Reflection
                                    </button>
                                </div>
                            </div>
                        </nav>
                    </div>

                    {/* Center Main col */}
                    <div className="col-span-12 flex h-full flex-col gap-4 overflow-hidden lg:col-span-7">
                        {/* Session Thumbnail */}
                        <div className="group relative h-48 w-full shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-sm">
                            <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                            <img src="https://images.unsplash.com/photo-1512413914565-df0a876a3ff8?q=80&w=2420&auto=format&fit=crop" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Yoga Session" />
                            <div className="absolute inset-0 z-20 flex flex-row items-center justify-between gap-4 p-5">
                                <div className="max-w-md">
                                    <div className="mb-1.5 flex items-center gap-2">
                                        <span className="flex h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-red-400">Live Session Available</span>
                                    </div>
                                    <h2 className="mb-2 text-2xl font-bold tracking-tight text-white">{activeBatch?.name || 'Interactive Session'}</h2>
                                    <div className="flex gap-3">
                                        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-1 backdrop-blur-md">
                                            <GraduationCap className="h-3.5 w-3.5 text-white/70" />
                                            <span className="text-xs font-medium text-white">Mentor {activeBatch?.instructor?.full_name || 'Palki'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-2">
                                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all hover:-translate-y-0.5 hover:bg-red-600">
                                        <Play className="h-5 w-5" />
                                        Join Meeting
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">

                            {/* Recorded Sessions Row */}
                            <div className="flex flex-col overflow-hidden rounded-xl border border-white/60 bg-white/65 shadow-sm backdrop-blur-md">
                                <div className="flex items-center justify-between border-b border-pink-50 bg-white/40 p-3">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                        <PlayCircle className="h-4 w-4 text-pink-500" />
                                        Catch Up on Past Sessions
                                    </h3>
                                </div>
                                <div className="flex overflow-x-auto p-4 custom-scrollbar gap-4">
                                    {/* Placeholder Recorded Items */}
                                    <div className="group flex h-[140px] w-[200px] min-w-[200px] flex-col rounded-lg border border-pink-100 bg-white/60 shadow-sm transition-all hover:border-pink-300 cursor-pointer">
                                        <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-t-lg bg-gray-200">
                                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
                                                <PlayCircle className="h-8 w-8 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop" className="h-full w-full object-cover" alt="" />
                                            <div className="absolute bottom-2 right-2 z-20 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">45:10</div>
                                        </div>
                                        <div className="flex flex-1 flex-col justify-center p-2">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[9px] font-bold text-pink-500">Day 11</span>
                                                <span className="text-[9px] text-gray-500">Yesterday</span>
                                            </div>
                                            <h4 className="line-clamp-1 text-xs font-bold text-gray-900">Full Face Activation</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Transformation Journey and Resources Row Grid */}
                            <div className="grid grid-cols-12 gap-4">

                                {/* Transformation Journey */}
                                <div className="col-span-12 flex flex-col rounded-xl border border-white/60 bg-white/65 shadow-sm backdrop-blur-md xl:col-span-7">
                                    <div className="border-b border-pink-50 bg-white/40 p-3">
                                        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                            <Star className="h-4 w-4 text-pink-500" />
                                            Transformation Journey - Day {activeStepDay}
                                        </h3>
                                    </div>
                                    <div className="flex-1 p-4 flex flex-col gap-4">
                                        <Stepper value={activeStepDay} onValueChange={setActiveStepDay} className="w-full">
                                            <StepperNav>
                                                {MILESTONE_DAYS.map((day) => (
                                                    <StepperItem key={day} step={day} completed={journeyLogs.some(l => l.day_number === day)}>
                                                        <StepperTrigger><StepperIndicator>{day}</StepperIndicator></StepperTrigger>
                                                        {MILESTONE_DAYS.indexOf(day) < MILESTONE_DAYS.length - 1 && <StepperSeparator className="mx-2" />}
                                                    </StepperItem>
                                                ))}
                                            </StepperNav>
                                        </Stepper>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="rounded-xl overflow-hidden ring-1 ring-black/5 shadow-md bg-white aspect-[4/3]">
                                                {activeStepDay < 7 || !afterImage ? (
                                                    <img src={beforeImage} alt="Day 1" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageComparison beforeImage={beforeImage} afterImage={afterImage} altBefore="Day 1" altAfter={`Day ${activeStepDay}`} />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <textarea
                                                    value={notesInput}
                                                    onChange={(e) => setNotesInput(e.target.value)}
                                                    className="flex-1 min-h-[100px] rounded-lg border border-pink-100 bg-white/50 p-3 text-xs outline-none focus:ring-1 focus:ring-pink-500"
                                                    placeholder="How do you feel today?"
                                                />
                                                <div className="flex gap-2">
                                                    <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />
                                                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 rounded-lg border border-pink-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-pink-50">
                                                        <Camera className="h-4 w-4 text-pink-500" /> Photo
                                                    </button>
                                                    <button onClick={handleSaveLog} disabled={isSavingLog} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-pink-500 py-2 text-xs font-bold text-white shadow-md hover:bg-pink-600 disabled:opacity-50">
                                                        {isSavingLog ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Save
                                                    </button>
                                                </div>
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
                                            <div key={res.id} className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-pink-100 bg-white/60 p-2.5 transition-all hover:border-pink-300 hover:shadow-sm">
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
                                                    onClick={() => window.open(res.file_url, '_blank')}
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
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex gap-2 ${msg.sender_id === currentUser.id ? 'flex-row-reverse' : ''}`}>
                                        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-pink-200">
                                            {msg.sender?.avatar_url ? (
                                                <img src={msg.sender.avatar_url} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-pink-600">
                                                    {(msg.sender?.full_name || 'U').charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`flex max-w-[85%] flex-col ${msg.sender_id === currentUser.id ? 'items-end' : ''}`}>
                                            <div className="mb-0.5 flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-gray-900">{msg.sender?.full_name || 'User'}</span>
                                                <span className="text-[9px] text-gray-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {msg.sender?.role === 'instructor' && (
                                                    <span className="flex items-center gap-0.5 rounded border border-pink-200 bg-pink-50 px-1 text-[9px] font-bold text-pink-500">Instructor <CheckCircle className="h-2 w-2" /></span>
                                                )}
                                            </div>
                                            <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${msg.sender_id === currentUser.id ? 'rounded-tr-none bg-pink-500 text-white' : 'rounded-tl-none border border-white/50 bg-white text-gray-900'}`}>
                                                <p>{msg.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
