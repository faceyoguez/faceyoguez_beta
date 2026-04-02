'use client';

import { useState, useRef, useTransition } from 'react';
import { toast } from 'sonner';
import {
    Search, Plus, Users,
    Award, Settings, Calendar, Play,
    FileText, Send, Video, Library,
    BarChart2, X, CheckCircle, Download, Clock, Loader2, ArrowUpRight,
    Sparkles, ArrowRight, ChevronRight, Radio, PlayCircle, ChevronDown, Activity
} from 'lucide-react';
import { createAndPopulateBatch, type CreateBatchInput } from '@/lib/actions/batches';
import { useRouter } from 'next/navigation';
import type { Profile, BatchPoll, RecordedSession } from '@/types/database';
import { uploadBatchResource, getBatchResources } from '@/lib/actions/resources';
import { getBatchMessages, sendBatchMessage, toggleBatchChat } from '@/lib/actions/chat';
import { createBatchPoll, getBatchPollsMap, getPollById, closePoll } from '@/lib/actions/polls';
import { getBatchRecordedSessions } from '@/lib/actions/meetings';
import { PollCard } from '@/components/ui/poll-card';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface GroupClientProps {
    currentUser: Profile;
    initialBatches: any[];
    initialBatchResources: any[];
    instructors: { id: string; full_name: string; email: string; avatar_url: string | null; is_master_instructor: boolean }[];
    waitingQueue: any[];
}

export function InstructorGroupClient({ currentUser, initialBatches, initialBatchResources, instructors, waitingQueue }: GroupClientProps) {
    const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const [batches, setBatches] = useState(initialBatches);
    const [selectedBatch, setSelectedBatch] = useState<any>(initialBatches.find(b => b.status === 'active') || initialBatches[0] || null);
    const [resources, setResources] = useState(initialBatchResources);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync Server Data into Client State
    useEffect(() => {
        setBatches(initialBatches);
        const batch = initialBatches.find(b => b.status === 'active') || initialBatches[0] || null;
        setSelectedBatch(batch);
        setResources(initialBatchResources);
        if (batch) fetchRecordings(batch);
    }, [initialBatches, initialBatchResources]);

    // Chat State
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isChatEnabled, setIsChatEnabled] = useState(true);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Poll State
    const [polls, setPolls] = useState<Record<string, BatchPoll>>({});
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [isCreatingPoll, setIsCreatingPoll] = useState(false);

    // Recordings State
    const [recordings, setRecordings] = useState<RecordedSession[]>([]);
    const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);

    useEffect(() => {
        if (!selectedBatch?.id) return;

        const fetchAll = async () => {
            const [msgs, pollsMap] = await Promise.all([
                getBatchMessages(selectedBatch.id),
                getBatchPollsMap(selectedBatch.id, currentUser.id),
            ]);
            setMessages(msgs);
            setPolls(pollsMap);
            setIsChatEnabled(selectedBatch.is_chat_enabled ?? true);
        };
        fetchAll();

        const msgChannel = supabase
            .channel(`batch-chat-${selectedBatch.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'batch_messages',
                    filter: `batch_id=eq.${selectedBatch.id}`
                },
                async (payload: { new: any }) => {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, role')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMsg = { ...payload.new, sender: profile };
                    setMessages(prev => [...prev, newMsg]);

                    if (payload.new.message_type === 'poll' && payload.new.poll_id) {
                        const pollData = await getPollById(payload.new.poll_id, currentUser.id);
                        if (pollData) setPolls(prev => ({ ...prev, [pollData.id]: pollData }));
                    }
                }
            )
            .subscribe();

        const voteChannel = supabase
            .channel(`batch-votes-${selectedBatch.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'batch_poll_votes' },
                async (payload: { new: any }) => {
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
    }, [selectedBatch?.id, supabase, currentUser.id]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedBatch?.id) return;
        const res = await sendBatchMessage(selectedBatch.id, newMessage.trim(), currentUser.id);
        if (res.success) setNewMessage('');
        else toast.error(res.error);
    };

    const handleToggleChat = async () => {
        if (!selectedBatch?.id) return;
        const nextState = !isChatEnabled;
        const res = await toggleBatchChat(selectedBatch.id, nextState);
        if (res.success) setIsChatEnabled(nextState);
        else toast.error(res.error);
    };

    const handleCreatePoll = async () => {
        if (!selectedBatch?.id) return;
        setIsCreatingPoll(true);
        const res = await createBatchPoll(selectedBatch.id, pollQuestion, pollOptions);
        if (res.success) {
            setShowPollModal(false);
            setPollQuestion('');
            setPollOptions(['', '']);
        } else toast.error(res.error);
        setIsCreatingPoll(false);
    };

    const handleClosePoll = async (pollId: string) => {
        const res = await closePoll(pollId);
        if (res.success) {
            setPolls(prev => ({ ...prev, [pollId]: { ...prev[pollId], is_closed: true } }));
        } else toast.error(res.error);
    };

    const [formData, setFormData] = useState<Partial<CreateBatchInput>>({
        name: '', startDate: '', endDate: '', maxStudents: 30, instructorId: currentUser.id
    });

    const handleCreateBatch = async () => {
        if (!formData.name || !formData.startDate || !formData.endDate) {
            toast.error("Temporal coordinates incomplete."); return;
        }
        startTransition(async () => {
            const result = await createAndPopulateBatch({
                name: formData.name!, startDate: formData.startDate!, endDate: formData.endDate!,
                maxStudents: formData.maxStudents || 30, instructorId: formData.instructorId || currentUser.id,
            });
            if (result.success) {
                setIsCreateBatchOpen(false);
                setFormData({ name: '', startDate: '', endDate: '', maxStudents: 30, instructorId: currentUser.id });
                router.refresh();
            } else alert("Error: " + result.error);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedBatch) return;
        if (file.size > 20 * 1024 * 1024) { alert("File size must be less than 20MB."); return; }
        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const res = await uploadBatchResource(selectedBatch.id, file.name, file.type, file.size, base64);
                if (res.success) {
                    const updated = await getBatchResources(selectedBatch.id);
                    setResources(updated);
                } else alert("Upload failed: " + res.error);
                setIsUploading(false);
            };
        } catch (err) { console.error(err); setIsUploading(false); }
    };

    const fetchRecordings = async (batch: any) => {
        if (!batch?.id || !batch?.end_date) return;
        setIsLoadingRecordings(true);
        const recs = await getBatchRecordedSessions(batch.id, batch.end_date);
        setRecordings(recs);
        setIsLoadingRecordings(false);
    };

    const handleBatchChange = async (batch: any) => {
        setSelectedBatch(batch);
        const batchResources = await getBatchResources(batch.id);
        setResources(batchResources);
        fetchRecordings(batch);
    };

    const [showZoomModal, setShowZoomModal] = useState(false);
    const [zoomTopic, setZoomTopic] = useState('');
    const [zoomDate, setZoomDate] = useState('');
    const [zoomTime, setZoomTime] = useState('');
    const [zoomDuration, setZoomDuration] = useState('60');
    const [isSchedulingZoom, setIsSchedulingZoom] = useState(false);
    const [zoomMeeting, setZoomMeeting] = useState<{ join_url: string; start_url: string; topic: string; start_time: string; duration_ms: number } | null>(null);
    const [isJoinEnabled, setIsJoinEnabled] = useState(false);
    const [meetingCountdown, setMeetingCountdown] = useState('');

    useEffect(() => {
        if (!zoomMeeting) { setMeetingCountdown(''); return; }
        const update = () => {
            const diff = new Date(zoomMeeting.start_time).getTime() - Date.now();
            setIsJoinEnabled(diff <= 300000 && diff > -zoomMeeting.duration_ms);
            if (diff <= 0) setMeetingCountdown('Live now');
            else {
                const totalMins = Math.ceil(diff / 60000);
                const hrs = Math.floor(totalMins / 60);
                const mins = totalMins % 60;
                setMeetingCountdown(hrs > 0 ? `Starts in ${hrs}h ${mins}m` : `Starts in ${mins}m`);
            }
        };
        update();
        const interval = setInterval(update, 10000);
        return () => clearInterval(interval);
    }, [zoomMeeting]);

    const handleScheduleZoom = async () => {
        if (!selectedBatch || !zoomTopic || !zoomDate || !zoomTime) { toast.error('Temporal coordinates incomplete.'); return; }
        setIsSchedulingZoom(true);
        try {
            const startDateTime = new Date(`${zoomDate}T${zoomTime}`).toISOString();
            const res = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: zoomTopic, startTime: startDateTime, durationMinutes: parseInt(zoomDuration, 10),
                    meetingType: 'group_session', batchId: selectedBatch.id,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to schedule meeting');
            const meeting = data.meeting;
            setZoomMeeting({
                join_url: meeting.join_url, start_url: meeting.start_url, topic: meeting.topic || zoomTopic,
                start_time: meeting.start_time || startDateTime, duration_ms: parseInt(zoomDuration, 10) * 60000,
            });
            setShowZoomModal(false); setZoomTopic(''); setZoomDate(''); setZoomTime(''); setZoomDuration('60');
            toast.success('Session scheduled.');
        } catch (e: any) { toast.error(e.message); } finally { setIsSchedulingZoom(false); }
    };

    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const filteredStudents = useMemo(() => {
        if (!selectedBatch?.batch_enrollments) return [];
        if (!studentSearchQuery) return selectedBatch.batch_enrollments;
        return selectedBatch.batch_enrollments.filter((e: any) => {
            const name = e.student?.full_name?.toLowerCase() || '';
            return name.includes(studentSearchQuery.toLowerCase());
        });
    }, [selectedBatch?.batch_enrollments, studentSearchQuery]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground selection:bg-primary/20 overflow-hidden font-sans">
      
      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[40vw] h-[40vh] bg-primary/2 rounded-full blur-[120px] -z-10" />

      {/* Header: Student-style airy title */}
      <header className="shrink-0 p-6 lg:p-10 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-12">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Group Sessions</h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/30">Collective Guidance Hub</p>
          </div>

          <div className="hidden lg:flex items-center gap-8 ml-4">
            <button 
              onClick={() => setIsCreateBatchOpen(true)}
              className="h-10 px-5 rounded-xl bg-white/50 backdrop-blur-xl border border-outline-variant/10 shadow-sm flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-widest hover:border-primary/20 hover:bg-white transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              Manifest Batch
            </button>
            <div className="h-6 w-px bg-outline-variant/10" />
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Active Students</span>
                <span className="text-sm font-bold text-primary">
                  {selectedBatch?.batch_enrollments?.filter((e: any) => e.status === 'active').length || 0} Enrolled
                </span>
              </div>
              <div className="h-4 w-px bg-outline-variant/10" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Waiting Queue</span>
                <span className="text-sm font-bold text-primary">{waitingQueue.length} Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/20 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search batches..."
              className="h-10 w-56 pl-10 pr-4 rounded-xl bg-white/50 backdrop-blur-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/5 text-[11px] font-medium placeholder:text-foreground/20 transition-all shadow-sm"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-6 lg:p-10 lg:pt-2 gap-4 xl:gap-6 min-w-0">
        
        {/* LEFT: Batch & Student Rail */}
        <div className="w-64 xl:w-80 flex flex-col gap-6 shrink-0 h-full min-w-0">
          {/* Batches */}
          <div className="flex-[0.35] bg-white/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <div className="p-6 border-b border-outline-variant/5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30">Active Paths</h3>
              </div>
              <p className="text-xs font-bold text-foreground">Current Collectives</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
              {batches.map((batch) => (
                <button
                  key={batch.id}
                  onClick={() => handleBatchChange(batch)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                    selectedBatch?.id === batch.id 
                      ? "bg-white border border-outline-variant/10 shadow-sm" 
                      : "bg-transparent border border-transparent hover:bg-white/40 hover:border-outline-variant/5"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[13px] font-bold text-foreground truncate group-hover:text-primary transition-colors">{batch.name}</h4>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-foreground/20 mt-0.5">{batch.status === 'active' ? 'Operational' : 'Concluded'}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-foreground/10 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Enrolled Students */}
          <div className="flex-[0.65] bg-white/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <div className="p-6 border-b border-outline-variant/5">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30">Enrolled Students</h3>
                  <p className="text-xs font-bold text-foreground leading-none">Inhabiting Space</p>
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg">{filteredStudents.length}</span>
              </div>
              
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/20 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Identify soul..."
                  className="w-full h-8 pl-8 pr-4 rounded-lg bg-foreground/5 border border-transparent focus:bg-white focus:border-outline-variant/10 text-[10px] font-bold placeholder:text-foreground/20 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
              {filteredStudents.map((enrollment: any) => (
                <div key={enrollment.student_id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/40 border border-transparent hover:border-outline-variant/5 transition-all group">
                  <div className="h-8 w-8 rounded-lg overflow-hidden shadow-sm shrink-0 border border-primary/5">
                    {enrollment.student?.avatar_url ? (
                      <img src={enrollment.student.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-foreground/20 bg-primary/5 uppercase">
                        {enrollment.student?.full_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-foreground truncate">{enrollment.student?.full_name}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-foreground/20">{enrollment.is_trial_access ? 'Discovery' : 'Committed'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: Session Unfolding */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden min-w-0">
          {/* Active Session Card */}
          <div className="shrink-0 group relative h-40 w-full overflow-hidden rounded-[2rem] border border-outline-variant/10 shadow-sm bg-foreground flex items-center">
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2420&auto=format&fit=crop" className="absolute inset-0 h-full w-full object-cover opacity-60 grayscale transition-transform duration-[2000ms] group-hover:scale-105" alt="" />
            
            <div className="relative z-20 flex flex-col justify-center p-8 w-full max-w-xl">
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className={cn("h-1.5 w-1.5 rounded-full", selectedBatch?.status === 'active' ? "bg-primary animate-pulse" : "bg-white/20")} />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
                    {selectedBatch?.status === 'active' ? 'Path Active' : 'Session Resting'}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight truncate">
                  {selectedBatch?.name || 'Select a Batch'}
                </h2>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowZoomModal(true)}
                    className="h-9 px-6 rounded-xl bg-primary text-white text-[9px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md hover:-translate-y-0.5"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    Initiate Session
                  </button>
                  <button className="h-9 px-5 rounded-xl bg-white/10 backdrop-blur-md text-white border border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
                    Calibration
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-xl rounded-[2rem] border border-outline-variant/10 shadow-sm overflow-hidden overflow-y-auto custom-scrollbar p-6 xl:p-8">


            <div className="flex flex-col gap-6 flex-1">
              {/* Registry */}
              <div className="flex flex-col bg-white/30 rounded-2xl border border-outline-variant/5 min-h-[180px] h-[50%]">
                <div className="p-4 border-b border-outline-variant/5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30">Registry Artifacts</h3>
                    <span className="text-[10px] font-bold text-primary opacity-40">{resources.length}</span>
                  </div>
                  <button
                    disabled={!selectedBatch || isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 transition-colors border border-primary/10"
                  >
                    {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-2 custom-scrollbar">
                  {resources.map((res: any) => (
                    <button key={res.id} onClick={() => window.open(res.file_url, '_blank')} className="w-full flex items-center gap-3 p-3 bg-white hover:bg-white/80 border border-outline-variant/5 rounded-xl transition-all text-left shadow-sm">
                      <div className="h-8 w-8 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/30 shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-foreground truncate">{res.title || res.file_name}</p>
                        <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest mt-0.5">Artifact</p>
                      </div>
                    </button>
                  ))}
                  {resources.length === 0 && (
                    <div className="h-full min-h-[80px] flex flex-col items-center justify-center opacity-20 py-4">
                      <Library className="w-6 h-6 mb-2" />
                      <p className="text-[9px] font-bold uppercase tracking-widest">Pristine State</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chronicles */}
              <div className="flex flex-col bg-white/30 rounded-2xl border border-outline-variant/5 min-h-[180px] h-[50%]">
                <div className="p-4 border-b border-outline-variant/5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30">Session History</h3>
                    <span className="text-[10px] font-bold text-primary opacity-40">{recordings.length}</span>
                  </div>
                  <PlayCircle className="w-4 h-4 text-foreground/10" />
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-2 custom-scrollbar">
                  {recordings.map((rec) => (
                    <button key={rec.id} onClick={() => window.open(rec.play_url!, '_blank')} className="w-full flex items-center gap-3 p-3 bg-white hover:bg-white/80 border border-outline-variant/5 rounded-xl transition-all text-left shadow-sm group">
                      <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                        <Play className="w-3.5 h-3.5 fill-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-foreground truncate">{rec.topic}</p>
                        <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest mt-0.5">{new Date(rec.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </button>
                  ))}
                  {recordings.length === 0 && (
                    <div className="h-full min-h-[80px] flex flex-col items-center justify-center opacity-20 py-4">
                      <Video className="w-6 h-6 mb-2" />
                      <p className="text-[9px] font-bold uppercase tracking-widest">No Archives</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Communion & Pulse */}
        <div className="w-72 xl:w-96 flex flex-col gap-6 shrink-0 h-full min-w-0">
          {/* Chat Window */}
          <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-outline-variant/5 flex items-center justify-between bg-white/10">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30">Group Chat</h3>
                  <span className="text-[9px] font-bold text-primary opacity-40">{messages.length}</span>
                </div>
                <p className="text-xs font-bold text-foreground">Batch Dialogue</p>
              </div>
              <button onClick={handleToggleChat} className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-all border", isChatEnabled ? "bg-primary text-white border-transparent shadow-sm" : "bg-primary/5 text-primary border-primary/10")}>
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto p-6 custom-scrollbar">
              {messages.map((msg) => {
                const senderProfile = msg.sender || msg.profiles || msg.senderProfile || {};
                const isPoll = msg.message_type === 'poll' && msg.poll_id;
                const poll = isPoll ? polls[msg.poll_id] : null;
                const isMe = msg.sender_id === currentUser.id;

                return (
                  <div key={msg.id} className={cn("flex flex-col gap-1.5", isMe ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[7px] font-bold uppercase tracking-widest text-foreground/20">{isMe ? 'Internal' : (senderProfile?.full_name || 'Manifestor')}</span>
                      <span className="text-[7px] text-foreground/10">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {isPoll ? (
                      poll ? <div className="w-full scale-90 origin-top"><PollCard poll={poll} isAdmin onClose={() => handleClosePoll(poll.id)} /></div> : null
                    ) : (
                      <div className={cn("px-4 py-3 rounded-xl text-[11px] font-medium leading-relaxed max-w-[90%] shadow-sm", isMe ? "bg-foreground text-background rounded-tr-none" : "bg-white text-foreground rounded-tl-none border border-outline-variant/5")}>
                        {msg.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white/40 border-t border-outline-variant/5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPollModal(true)}
                  className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors border border-primary/10 shrink-0"
                >
                  <BarChart2 className="w-4 h-4" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Direct the collective..."
                    className="w-full h-10 rounded-lg bg-white border border-outline-variant/10 pl-4 pr-10 text-[11px] font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                  />
                  <button onClick={handleSendMessage} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
      {showPollModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={() => setShowPollModal(false)} />
          <div className="w-full max-w-xl rounded-[2.5rem] bg-white border border-outline-variant/10 shadow-2xl relative z-10 overflow-hidden p-12 space-y-10 animate-in zoom-in-95 duration-500">
            <header className="space-y-3 text-center">
              <h3 className="text-3xl font-bold text-foreground tracking-tight">Initiate Inquiry</h3>
              <p className="text-sm text-foreground/40 font-medium">Sampling orchestration in {selectedBatch?.name}</p>
            </header>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 ml-1">Inquiry Focus</label>
                <input
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Share an update with the group..."
                  className="w-full h-14 rounded-xl bg-foreground/5 border-none px-6 text-sm font-bold text-foreground placeholder:text-foreground/20 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 ml-1">Potential Paths</label>
                <div className="grid grid-cols-1 gap-3">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="relative group">
                      <input
                        value={opt}
                        onChange={(e) => {
                          const next = [...pollOptions];
                          next[i] = e.target.value;
                          setPollOptions(next);
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="w-full h-12 rounded-xl bg-foreground/5 border-none pl-6 pr-12 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {pollOptions.length > 2 && (
                        <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-primary"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 6 && (
                  <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[9px] font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-all">+ Add Potential Path</button>
                )}
              </div>
            </div>

            <button
              onClick={handleCreatePoll}
              disabled={isCreatingPoll || !pollQuestion.trim() || pollOptions.filter(Boolean).length < 2}
              className="w-full h-16 rounded-2xl bg-foreground text-background text-[10px] font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all disabled:opacity-20"
            >
              {isCreatingPoll ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Release Inquiry'}
            </button>
          </div>
        </div>
      )}

      {showZoomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={() => setShowZoomModal(false)} />
          <div className="w-full max-w-xl rounded-[2.5rem] bg-white border border-outline-variant/10 shadow-2xl relative z-10 overflow-hidden p-12 space-y-10 animate-in zoom-in-95 duration-500">
            <header className="space-y-3 text-center">
              <h3 className="text-3xl font-bold text-foreground tracking-tight">Manifest Space</h3>
              <p className="text-sm text-foreground/40 font-medium">Direct calibration for {selectedBatch?.name}</p>
            </header>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 ml-1">Session Topic</label>
                <input
                  type="text"
                  value={zoomTopic}
                  onChange={(e) => setZoomTopic(e.target.value)}
                  placeholder="e.g. Evening Face Yoga Class"
                  className="w-full h-14 rounded-xl bg-foreground/5 border-none px-6 text-sm font-bold text-foreground placeholder:text-foreground/20 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 ml-1">Date</label>
                  <input
                    type="date"
                    value={zoomDate}
                    onChange={(e) => setZoomDate(e.target.value)}
                    className="w-full h-14 rounded-xl bg-foreground/5 border-none px-6 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 ml-1">Time</label>
                  <input
                    type="time"
                    value={zoomTime}
                    onChange={(e) => setZoomTime(e.target.value)}
                    className="w-full h-14 rounded-xl bg-foreground/5 border-none px-6 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleScheduleZoom}
              disabled={isSchedulingZoom || !zoomTopic || !zoomDate || !zoomTime}
              className="w-full h-16 rounded-2xl bg-foreground text-background text-[10px] font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all disabled:opacity-20"
            >
              {isSchedulingZoom ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Schedule Session
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {isCreateBatchOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={() => setIsCreateBatchOpen(false)} />
          <div className="w-full max-w-xl rounded-[2.5rem] bg-white border border-outline-variant/10 shadow-2xl relative z-10 overflow-hidden p-12 space-y-10 animate-in zoom-in-95 duration-500">
            <header className="space-y-3 text-center">
              <h3 className="text-3xl font-bold text-foreground tracking-tight">Manifest Path</h3>
              <p className="text-sm text-foreground/40 font-medium">Create a new collective journey</p>
            </header>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 ml-1">Batch Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Genesis Phase April"
                  className="w-full h-14 rounded-xl bg-foreground/5 border-none px-6 text-sm font-bold text-foreground placeholder:text-foreground/20 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 ml-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full h-14 rounded-xl bg-foreground/5 border-none px-6 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 ml-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full h-14 rounded-xl bg-foreground/5 border-none px-6 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateBatch}
              disabled={isPending}
              className="w-full h-16 rounded-2xl bg-foreground text-background text-[10px] font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all disabled:opacity-20"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Commit Path'}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
