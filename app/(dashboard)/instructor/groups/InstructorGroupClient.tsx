'use client';

import { useState, useRef, useTransition, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
    Search, Plus, Users,
    Award, Settings, Calendar, Play,
    FileText, Send, Video, Library,
    BarChart2, X, CheckCircle, Download, Clock, Loader2, ArrowUpRight,
    Sparkles, ArrowRight, ChevronRight, Radio, PlayCircle, ChevronDown, Activity,
    History, MessageSquare, Zap
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
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Authentic Peach Zen Tokens
const PEACH_TOKENS = {
  primary: '#FF8A75',       // Faceyoguez Peach
  accent: '#FF6B4E',        // Energetic Salmon
  background: '#FFFAF7',    // Sanctuary Bone
  text: '#1a1a1a',          // Authority Dark
  surface: '#FFFFFF',       // Pure Layer
};

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
    const [searchQuery, setSearchQuery] = useState('');

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

    // Zoom Meeting State (Legacy but referenced)
    const [showZoomModal, setShowZoomModal] = useState(false);
    const [zoomTopic, setZoomTopic] = useState('');
    const [zoomDate, setZoomDate] = useState('');
    const [zoomTime, setZoomTime] = useState('');
    const [isSchedulingZoom, setIsSchedulingZoom] = useState(false);

    // Create Batch Form
    const [formData, setFormData] = useState<Partial<CreateBatchInput>>({
        name: '', startDate: '', endDate: '', maxStudents: 30, instructorId: currentUser.id
    });

    // ─── EFFECTS ───
    useEffect(() => {
        setBatches(initialBatches);
        const batch = initialBatches.find(b => b.status === 'active') || initialBatches[0] || null;
        setSelectedBatch(batch);
        setResources(initialBatchResources);
        if (batch) fetchRecordings(batch);
    }, [initialBatches, initialBatchResources]);

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
                { event: 'INSERT', schema: 'public', table: 'batch_messages', filter: `batch_id=eq.${selectedBatch.id}` },
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

        return () => { supabase.removeChannel(msgChannel); };
    }, [selectedBatch?.id, supabase, currentUser.id]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // ─── HANDLERS ───
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedBatch?.id) return;
        const res = await sendBatchMessage(selectedBatch.id, newMessage.trim(), currentUser.id);
        if (res.success) setNewMessage('');
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedBatch) return;
        setIsUploading(true);
        try {
            const buffer = await file.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const res = await uploadBatchResource(selectedBatch.id, file.name, file.type, file.size, base64);
            if (res.success) {
                const updated = await getBatchResources(selectedBatch.id);
                setResources(updated);
            }
        } catch (err) { console.error(err); } finally { setIsUploading(false); }
    };

    const fetchRecordings = async (batch: any) => {
        if (!batch?.id || !batch?.end_date) return;
        setIsLoadingRecordings(true);
        const recs = await getBatchRecordedSessions(batch.id, batch.end_date);
        setRecordings(recs);
        setIsLoadingRecordings(false);
    };

    const handleBatchClick = async (batch: any) => {
        setSelectedBatch(batch);
        const [batchResources] = await Promise.all([
          getBatchResources(batch.id),
          fetchRecordings(batch)
        ]);
        setResources(batchResources);
    };

    const handleCreateBatch = async () => {
      if (!formData.name || !formData.startDate || !formData.endDate) {
          toast.error("Format incomplete."); return;
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
          } else toast.error(result.error);
      });
    };

    const filteredBatches = useMemo(() => {
        return batches.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [batches, searchQuery]);

    // ─── RENDER ───
    return (
      <div className="flex flex-col h-screen bg-[#FFFAF7] text-[#1a1a1a] selection:bg-[#FF8A75]/10 overflow-hidden font-sans">
        
        {/* Kinetic Aura Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-[#FF8A75]/10 rounded-full blur-[140px] opacity-60 animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-[#FF6B4E]/5 rounded-full blur-[140px] opacity-40" />
        </div>

        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          
          <header className="shrink-0 h-24 px-10 flex items-center justify-between border-b border-[#FF8A75]/10 bg-white/40 backdrop-blur-xl">
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1.5 bg-[#FF8A75] rounded-full" />
                <div>
                  <h1 className="text-3xl font-serif tracking-tight text-[#1a1a1a]">Collective Authority</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mt-1.5 opacity-60">Broadcast & Batch Management</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/20 group-focus-within:text-[#FF8A75] transition-colors" />
                <input
                  type="text"
                  placeholder="Locate Batch..."
                  className="h-14 w-72 pl-14 pr-8 rounded-2xl bg-white border border-[#FF8A75]/5 shadow-sm text-sm font-medium focus:ring-2 focus:ring-[#FF8A75]/10 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsCreateBatchOpen(true)}
                className="h-14 w-14 rounded-2xl bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#FF8A75] transition-all shadow-xl"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </header>

          <main className="flex-1 flex overflow-hidden p-8 gap-8">
            {/* Sidebar */}
            <div className="w-80 shrink-0 flex flex-col gap-6 h-full">
              <div className="flex-1 bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-[#FF8A75]/10 shadow-2xl shadow-[#FF8A75]/5 flex flex-col overflow-hidden">
                <div className="p-10 border-b border-[#1a1a1a]/5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75]">Broadcast Directives</h3>
                  <p className="text-xl font-serif text-[#1a1a1a] mt-2">Active Batches</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {filteredBatches.map((batch) => {
                    const isSelected = selectedBatch?.id === batch.id;
                    return (
                      <button
                        key={batch.id}
                        onClick={() => handleBatchClick(batch)}
                        className={cn(
                          "w-full p-6 rounded-[2rem] text-left transition-all relative group",
                          isSelected ? "bg-white shadow-2xl shadow-[#FF8A75]/10 ring-1 ring-[#FF8A75]/10" : "bg-transparent hover:bg-white/40"
                        )}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="h-12 w-12 rounded-2xl bg-[#FF8A75]/5 flex items-center justify-center text-[#FF8A75] shadow-inner group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6" />
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-[#1a1a1a] truncate leading-none capitalize">{batch.name}</h4>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF8A75]/40 mt-3">{batch.session_type || 'Group Session'}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Central Area */}
            <div className="flex-1 flex flex-col gap-8 overflow-hidden">
              {selectedBatch ? (
                <>
                  <div className="shrink-0 h-64 rounded-[3.5rem] bg-white border border-[#FF8A75]/10 shadow-3xl shadow-[#FF8A75]/10 relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[140%] bg-gradient-to-l from-[#FF8A75]/10 to-transparent blur-[80px]" />
                    <div className="relative h-full flex flex-col justify-center p-12 lg:p-16">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-10">
                          <div className="h-32 w-32 rounded-[2.5rem] bg-[#FF8A75] flex items-center justify-center shadow-2xl">
                             <Video className="w-12 h-12 text-white" />
                          </div>
                          <div className="space-y-4">
                            <span className="px-5 py-2 rounded-full bg-[#FF8A75]/10 text-[#FF8A75] text-[10px] font-black uppercase tracking-[0.3em]">Live Broadcast</span>
                            <h2 className="text-6xl font-serif tracking-tight text-[#1a1a1a] leading-none capitalize">{selectedBatch.name}</h2>
                          </div>
                        </div>
                        <button 
                          onClick={() => window.open('/instructor/broadcast', '_blank')}
                          className="h-20 px-12 rounded-[2rem] bg-[#1a1a1a] text-white text-[12px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-[#FF8A75] transition-all shadow-2xl"
                        >
                           Initiate Flow
                           <ArrowUpRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                    {/* Chronicles */}
                    <div className="col-span-8 flex flex-col gap-8 min-h-0">
                      <div className="flex-1 bg-white/40 backdrop-blur-3xl rounded-[3.5rem] p-10 flex flex-col border border-[#FF8A75]/10 shadow-2xl shadow-[#FF8A75]/5 overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75]">Registry Chronicles</h3>
                          <button onClick={() => fileInputRef.current?.click()} className="h-10 w-10 rounded-xl bg-[#FF8A75] text-white flex items-center justify-center">
                            <Plus className="w-5 h-5" />
                          </button>
                          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                          {recordings.map((rec) => (
                            <div key={rec.id} className="p-6 rounded-[2.5rem] bg-white border border-transparent hover:border-[#FF8A75]/10 transition-all flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                <div className="h-14 w-14 rounded-2xl bg-[#FF8A75]/5 flex items-center justify-center text-[#FF8A75]"><Play className="w-6 h-6" /></div>
                                <p className="text-base font-bold text-[#1a1a1a]">{rec.topic}</p>
                              </div>
                              <button onClick={() => window.open(rec.play_url!, '_blank')} className="h-10 w-10 rounded-xl bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#FF8A75] transition-all">
                                <PlayCircle className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Chat */}
                    <div className="col-span-4 flex flex-col min-h-0">
                      <div className="flex-1 bg-[#1a1a1a] rounded-[4rem] p-8 flex flex-col overflow-hidden relative shadow-3xl">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75] mb-6">Collective Pulse</h3>
                        <div ref={chatContainerRef} className="flex-1 space-y-6 overflow-y-auto mb-6 custom-scrollbar pr-2">
                          {messages.map((msg) => {
                            const isMe = msg.sender_id === currentUser.id;
                            return (
                              <div key={msg.id} className={cn("flex flex-col gap-2", isMe ? "items-end" : "items-start")}>
                                <div className={cn("px-6 py-4 rounded-[1.5rem] text-sm font-medium", isMe ? "bg-[#FF8A75] text-white rounded-tr-none" : "bg-white/10 text-white rounded-tl-none")}>
                                  {msg.content}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Direct..."
                            className="w-full h-14 rounded-full bg-white/10 border-none pl-6 pr-14 text-sm text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#FF8A75]/50"
                          />
                          <button onClick={handleSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-[#FF8A75] text-white flex items-center justify-center">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center opacity-10"><Sparkles className="w-20 h-20" /></div>
              )}
            </div>
          </main>
        </div>

        {/* MODALS */}
        {isCreateBatchOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-2xl">
            <div className="w-full max-w-md bg-white rounded-[4rem] p-12 relative overflow-hidden shadow-4xl">
              <h3 className="text-3xl font-serif text-slate-900 mb-8 text-center">Manifest Path</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Batch Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-14 w-full px-6 rounded-2xl bg-slate-50 border-none text-sm font-bold focus:ring-2 focus:ring-[#FF8A75]/10" />
                <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="h-14 w-full px-6 rounded-2xl bg-slate-50 border-none text-sm font-bold focus:ring-2 focus:ring-[#FF8A75]/10" />
                <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="h-14 w-full px-6 rounded-2xl bg-slate-50 border-none text-sm font-bold focus:ring-2 focus:ring-[#FF8A75]/10" />
                <button onClick={handleCreateBatch} className="w-full h-16 rounded-3xl bg-[#1a1a1a] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#FF8A75] transition-all">Commit Path</button>
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 3px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,138,117,0.1); border-radius: 10px; }
        `}</style>
      </div>
    );
}
