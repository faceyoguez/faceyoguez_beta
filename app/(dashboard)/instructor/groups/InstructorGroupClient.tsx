'use client';

import { useState, useRef, useTransition, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
   Search, Plus, Users,
   Video, Play,
   FileText, Send, X,
   Download, 
   Loader2, ArrowUpRight,
   ArrowRight, 
   
   Activity, 
   
   ShieldCheck, ShieldAlert
} from 'lucide-react';
import { createAndPopulateBatch, type CreateBatchInput, toggleBatchChat, getInstructorBatches } from '@/lib/actions/batches';
import { useRouter } from 'next/navigation';
import type { RecordedSession, StudentResource } from '@/types/database';
import { uploadBatchResource, getBatchResources } from '@/lib/actions/resources';
import { sendBatchMessage, getBatchMessages } from '@/lib/actions/chat';
import { getBatchRecordedSessions } from '@/lib/actions/meetings';
import { getJourneyLogs, type JourneyLog } from '@/lib/actions/journey';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import { JOURNEY_MAX_DAY } from '@/components/ui/journey-progress';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function InstructorGroupClient({ currentUser, initialBatches, initialBatchResources, instructors, waitingQueue }: any) {
   const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
   const [isPending, startTransition] = useTransition();
   const router = useRouter();

   const [batches, setBatches] = useState(initialBatches);
   const [selectedBatch, setSelectedBatch] = useState<any>(initialBatches.find((b: any) => b.status === 'active') || initialBatches[0] || null);
   const [selectedStudent, setSelectedStudent] = useState<any>(null);
   const [resources, setResources] = useState<StudentResource[]>(initialBatchResources);
   const [journeyLogs, setJourneyLogs] = useState<JourneyLog[]>([]);
   const [isUploading, setIsUploading] = useState(false);
   const [isLoadingStudent, setIsLoadingStudent] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [searchQuery, setSearchQuery] = useState('');

   // Chat State
   const [messages, setMessages] = useState<any[]>([]);
   const [newMessage, setNewMessage] = useState('');
   const chatContainerRef = useRef<HTMLDivElement>(null);
   const supabase = createClient();

   // Recordings State
   const [recordings, setRecordings] = useState<RecordedSession[]>([]);

   // Create Batch Form
   const [formData, setFormData] = useState<Partial<CreateBatchInput>>({
      name: '', startDate: '', endDate: '', maxStudents: 30, instructorId: currentUser.id
   });

   // ─── EFFECTS ───
   useEffect(() => {
      setBatches(initialBatches);
      const batch = initialBatches.find((b: any) => b.status === 'active') || initialBatches[0] || null;
      setSelectedBatch(batch);
      setResources(initialBatchResources);
      if (batch) fetchRecordings(batch);
   }, [initialBatches, initialBatchResources]);

   useEffect(() => {
      if (!selectedBatch?.id) return;

      const fetchAll = async () => {
         const msgs = await getBatchMessages(selectedBatch.id);
         setMessages(msgs);
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
            }
         )
         .subscribe();

      return () => { supabase.removeChannel(msgChannel); };
   }, [selectedBatch?.id, supabase, currentUser.id]);

   useEffect(() => {
      if (!selectedStudent?.id) return;

      const fetchStudentDetails = async () => {
         setIsLoadingStudent(true);
         try {
            const logs = await getJourneyLogs(selectedStudent.id);
            setJourneyLogs(logs);
         } catch (e) {
            console.error("Failed to fetch student journey", e);
         } finally {
            setIsLoadingStudent(false);
         }
      };
      fetchStudentDetails();
   }, [selectedStudent]);

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
            toast.success('Resource shared successfully!');
         } else {
            toast.error(res.error || 'Failed to share resource');
         }
      } catch (err) {
         console.error(err);
         toast.error('Upload failed. Please try again.');
      } finally { setIsUploading(false); }
   };

   const fetchRecordings = async (batch: any) => {
      if (!batch?.id || !batch?.end_date) return;
      const recs = await getBatchRecordedSessions(batch.id, batch.end_date);
      setRecordings(recs);
   };

   const handleBatchClick = async (batch: any) => {
      setSelectedBatch(batch);
      setSelectedStudent(null);
      setJourneyLogs([]);
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
      return batches.filter((b: any) => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
   }, [batches, searchQuery]);

   const activeStudents = selectedBatch?.batch_enrollments?.map((e: any) => e.student) || [];

   // Transformation Derived Data
   const day1Log = journeyLogs.find(l => l.day_number === 1);
   const activeLog = journeyLogs.find(l => l.day_number === (selectedStudent ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedBatch?.start_date || Date.now()).getTime()) / 86400000) + 1)) : 1));
   const beforeImage = day1Log?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
   const afterImage = activeLog?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800';

   return (
      <div className="flex flex-col h-screen bg-[#FFFAF7] text-[#1a1a1a] selection:bg-[#FF8A75]/10 overflow-hidden font-sans animate-in fade-in duration-1000 relative">

         {/* Kinetic Aura Background */}
         <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-[#FF8A75]/10 rounded-full blur-[140px] opacity-60" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-[#FF6B4E]/5 rounded-full blur-[140px] opacity-40" />
         </div>

         <div className="relative z-10 flex flex-col h-full overflow-hidden">

            {/* Header (Title + Search + Create) */}
            <header className="shrink-0 h-24 px-12 flex items-center justify-between border-b border-[#FF8A75]/10 bg-white/40 backdrop-blur-3xl">
               <div className="flex items-center gap-6">
                  <div className="h-10 w-1.5 bg-[#FF8A75] rounded-full shadow-[0_0_12px_#FF8A75]" />
                  <div>
                     <h1 className="text-3xl font-serif tracking-tight text-[#1a1a1a]">Collective Sanctuary</h1>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] mt-1 opacity-60">Architect of Resonance</p>
                  </div>
               </div>

               <div className="flex items-center gap-8">
                  <div className="relative group w-80">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#FF8A75] transition-colors" />
                     <input
                        type="text"
                        placeholder="Seek resonance..."
                        className="h-12 w-full pl-12 pr-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#FF8A75]/10 text-[11px] font-bold focus:ring-4 focus:ring-[#FF8A75]/5 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                     />
                  </div>
                  <button
                     onClick={() => setIsCreateBatchOpen(true)}
                     className="h-12 w-12 rounded-2xl bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#FF8A75] hover:-rotate-3 transition-all shadow-xl shadow-[#1a1a1a]/10"
                  >
                     <Plus className="w-5 h-5" />
                  </button>
               </div>
            </header>

            <main className="flex-1 flex flex-col overflow-hidden">

               {/* 🗺️ Collective Compass Row (Active Batches) */}
               <div className="shrink-0 h-20 px-12 bg-white/20 backdrop-blur-md border-b border-[#FF8A75]/5 flex items-center z-50">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FF8A75] shrink-0 mr-10">Compass Nodes:</span>
                  <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
                     {filteredBatches.map((batch: any) => {
                        const isSelected = selectedBatch?.id === batch.id;
                        return (
                           <button
                              key={batch.id}
                              onClick={() => handleBatchClick(batch)}
                              className={cn(
                                 "flex items-center gap-3 px-6 py-2 rounded-full transition-all shrink-0 border whitespace-nowrap group",
                                 isSelected
                                    ? "bg-white border-[#FF8A75]/30 shadow-xl shadow-[#FF8A75]/5 ring-4 ring-[#FF8A75]/5"
                                    : "bg-transparent border-transparent opacity-40 hover:opacity-100"
                              )}
                           >
                              <div className={cn(
                                 "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                                 isSelected ? "bg-[#FF8A75] text-white rotate-6" : "bg-[#FF8A75]/10 text-[#FF8A75] group-hover:rotate-6"
                              )}>
                                 <Users className="w-4 h-4" />
                              </div>
                              <p className={cn("text-[11px] font-bold tracking-tight", isSelected ? "text-slate-900" : "text-slate-400")}>{batch.name}</p>
                           </button>
                        );
                     })}
                  </div>
               </div>

               <div className="flex-1 flex overflow-hidden p-12 pt-10 gap-12">

                  {/* LEFT MAJOR PANE (Master - 65%) */}
                  <div className="flex-[0.65] flex flex-col gap-12 min-w-0">

                     {/* 1. Meeting Portal (Full Width Action Tile) */}
                     <div className="shrink-0 w-full rounded-[3.5rem] bg-white border border-[#FF8A75]/10 shadow-2xl shadow-[#FF8A75]/5 relative overflow-hidden group p-7 px-10">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_top_right,rgba(255,138,117,0.15),transparent_70%)] blur-3xl" />
                        <div className="relative flex items-center justify-between">
                           <div className="flex items-center gap-8">
                              <div className="h-16 w-16 rounded-[2rem] bg-[#1a1a1a] flex items-center justify-center shadow-2xl relative group-hover:rotate-3 transition-transform duration-700">
                                 <Video className="w-7 h-7 text-[#FF8A75]" />
                                 <div className="absolute -top-1 -right-1 h-5 w-5 bg-[#FF8A75] rounded-full border-[3px] border-white flex items-center justify-center shadow-lg">
                                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] opacity-60">Meeting Portal Spectrum</div>
                                 <h2 className="text-3xl font-serif tracking-tight text-[#1a1a1a] leading-tight capitalize">{selectedBatch?.name || 'Infinite Sanctuary'}</h2>
                              </div>
                           </div>
                           <button
                              onClick={() => window.open('/instructor/broadcast', '_blank')}
                              className="h-14 px-10 rounded-[2rem] bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-[#FF8A75] hover:shadow-2xl hover:shadow-[#FF8A75]/30 transition-all duration-700 group/btn"
                           >
                              Initialize Portal
                              <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                           </button>
                        </div>
                     </div>

                     {/* 2. Collective Interaction (Roster | Chat Split) */}
                     <div className="flex-1 min-h-0 flex gap-10 overflow-hidden">

                        {/* Seeker Roster (Plain Vertical List) */}
                        <div className="w-[30%] flex flex-col h-full min-h-0">
                           <div className="flex items-center justify-between mb-6 px-4">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Seeker Roster</h3>
                              <span className="px-3 py-1 rounded-full bg-[#FF8A75]/5 text-[10px] font-black text-[#FF8A75] border border-[#FF8A75]/10">{activeStudents.length}</span>
                           </div>
                           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-4">
                              {activeStudents.map((student: any) => {
                                 const isSelected = selectedStudent?.id === student.id;
                                 return (
                                    <button
                                       key={student.id}
                                       onClick={() => setSelectedStudent(student)}
                                       className={cn(
                                          "w-full p-5 rounded-[2.5rem] border transition-all flex items-center gap-5 group",
                                          isSelected
                                             ? "bg-white border-[#FF8A75]/30 shadow-xl shadow-[#FF8A75]/5 ring-4 ring-[#FF8A75]/5"
                                             : "bg-transparent border-transparent hover:bg-white/60 hover:shadow-sm"
                                       )}
                                    >
                                       <div className="h-12 w-12 rounded-2xl overflow-hidden ring-[3px] ring-white shadow-lg bg-slate-50 shrink-0">
                                          {student.avatar_url ? (
                                             <img src={student.avatar_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                          ) : (
                                             <div className="h-full w-full flex items-center justify-center text-lg font-serif text-[#FF8A75]">{student.full_name[0]}</div>
                                          )}
                                       </div>
                                       <div className="text-left min-w-0">
                                          <p className="text-base font-bold text-slate-800 truncate leading-none capitalize">{student.full_name.split(' ')[0]}</p>
                                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF8A75] mt-1.5 opacity-60">Status: Active</p>
                                       </div>
                                    </button>
                                 );
                              })}
                           </div>
                        </div>

                        {/* Communion Pulse (Chat - Compact Middle) */}
                        <div className="flex-1 bg-[#1a1a1a] rounded-[4.5rem] p-10 flex flex-col h-full relative shadow-2xl shadow-slate-900/40">
                           <div className="flex items-center justify-between mb-8 shrink-0">
                              <div className="flex items-center gap-5">
                                 <div className="space-y-1">
                                    <h3 className="text-2xl font-serif text-white tracking-tight">Communion Pulse</h3>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75] opacity-80">Spectrum Feed Active</p>
                                 </div>
                                 {!selectedBatch?.is_chat_enabled && (
                                    <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                                       <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                                       <span className="text-[8px] font-black uppercase tracking-widest text-red-500">Node Restricted</span>
                                    </div>
                                 )}
                              </div>
                              <div className="flex items-center gap-4">
                                 <button
                                    onClick={async () => {
                                       if (!selectedBatch) return;
                                       const newStatus = !selectedBatch.is_chat_enabled;
                                       const res = await toggleBatchChat(selectedBatch.id, newStatus);
                                       if (res.success) {
                                          toast.success(newStatus ? 'Sanctuary Node Unlocked' : 'Sanctuary Node Restricted');
                                          const updatedBatches = await getInstructorBatches(currentUser.id);
                                          setBatches(updatedBatches);
                                          const current = updatedBatches.find((b: any) => b.id === selectedBatch.id);
                                          if (current) setSelectedBatch(current);
                                       }
                                    }}
                                    className={cn(
                                       "h-11 px-6 rounded-2xl flex items-center gap-3 transition-all text-[9px] font-black uppercase tracking-widest border",
                                       selectedBatch?.is_chat_enabled
                                          ? "bg-white/5 border-white/10 text-white/40 hover:text-[#FF8A75] hover:border-[#FF8A75]/30 hover:bg-white/10"
                                          : "bg-[#FF8A75] border-[#FF8A75] text-white shadow-2xl shadow-[#FF8A75]/30"
                                    )}
                                 >
                                    {selectedBatch?.is_chat_enabled ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                    {selectedBatch?.is_chat_enabled ? "Safe" : "Locked"}
                                 </button>
                              </div>
                           </div>

                           <div ref={chatContainerRef} className="flex-1 space-y-5 overflow-y-auto mb-8 custom-scrollbar pr-3">
                              {messages.map((msg) => {
                                 const isMe = msg.sender_id === currentUser.id;
                                 return (
                                    <div key={msg.id} className={cn("flex flex-col gap-2", isMe ? "items-end" : "items-start")}>
                                       {!isMe && <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#FF8A75] opacity-60 ml-4">{msg.sender?.full_name}</span>}
                                       <div className={cn(
                                          "px-6 py-4 rounded-[2.5rem] text-[13px] font-medium max-w-[85%] leading-relaxed shadow-lg",
                                          isMe
                                             ? "bg-[#FF8A75] text-white rounded-tr-none shadow-[#FF8A75]/20"
                                             : "bg-white/5 text-white/90 border border-white/5 rounded-tl-none backdrop-blur-xl"
                                       )}>
                                          {msg.content}
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>

                           <div className="relative mt-auto shrink-0 group">
                              <input
                                 type="text"
                                 value={newMessage}
                                 onChange={(e) => setNewMessage(e.target.value)}
                                 onKeyDown={(e) => e.key === 'Enter' && selectedBatch?.is_chat_enabled && handleSendMessage()}
                                 placeholder={selectedBatch?.is_chat_enabled ? "Enter resonance..." : "Sanctuary node is restricted"}
                                 disabled={!selectedBatch?.is_chat_enabled}
                                 className={cn(
                                    "w-full h-16 rounded-[2rem] border-none pl-8 pr-16 text-sm font-medium transition-all outline-none",
                                    selectedBatch?.is_chat_enabled
                                       ? "bg-white/10 text-white placeholder:text-white/20 focus:bg-white/15 focus:ring-4 focus:ring-[#FF8A75]/10"
                                       : "bg-white/[0.02] text-white/10 placeholder:text-white/5 cursor-not-allowed"
                                 )}
                              />
                              <button
                                 onClick={handleSendMessage}
                                 disabled={!selectedBatch?.is_chat_enabled}
                                 className={cn(
                                    "absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full text-white flex items-center justify-center transition-all transform active:scale-90",
                                    selectedBatch?.is_chat_enabled
                                       ? "bg-[#FF8A75] hover:bg-[#FF6B4E] shadow-xl shadow-[#FF8A75]/40"
                                       : "bg-white/5 text-white/10 cursor-not-allowed"
                                 )}
                              >
                                 <Send className="w-5 h-5" />
                              </button>
                           </div>
                        </div>

                     </div>

                  </div>

                  {/* RIGHT MAJOR PANE (Focus - 35%) */}
                  <div className="flex-[0.35] flex flex-col gap-12 min-h-0 min-w-0">

                     {/* Seeker Focus (Transformation Mirror) */}
                     <div className="bg-white rounded-[4.5rem] p-10 shadow-2xl shadow-[#FF8A75]/5 border border-[#FF8A75]/10 relative overflow-hidden flex flex-col gap-8 shrink-0 h-[480px]">
                        <div className="flex items-center justify-between relative z-10">
                           <div className="space-y-1">
                              <h3 className="text-2xl font-serif text-slate-900 tracking-tight">{selectedStudent?.full_name || 'Identity Mirror'}</h3>
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Evolution Spectrum Echo</p>
                           </div>
                           {selectedStudent && (
                              <div className="h-10 px-5 rounded-[1.2rem] bg-[#FF8A75]/5 flex items-center gap-3 border border-[#FF8A75]/10">
                                 <div className="h-2 w-2 rounded-full bg-[#FF8A75] animate-pulse" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75]">Focused</span>
                              </div>
                           )}
                        </div>

                        <div className="flex-1 rounded-[3rem] bg-[#FFFAF7] overflow-hidden relative border border-[#FF8A75]/10 group/mirror">
                           {selectedStudent ? (
                              <ImageComparison beforeImage={beforeImage} afterImage={afterImage} />
                           ) : (
                              <div className="h-full flex flex-col items-center justify-center opacity-20">
                                 <Activity className="w-12 h-12 text-[#FF8A75] mb-4" />
                                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Awaiting Calibration</p>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Registry Chronicles (Resources) */}
                     <div className="flex-1 bg-white/40 backdrop-blur-3xl rounded-[4.5rem] p-10 border border-[#FF8A75]/10 shadow-xl flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-8 shrink-0 px-2">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Registry Chronicles</h3>
                           <button
                              onClick={() => fileInputRef.current?.click()}
                              className="h-10 w-10 rounded-2xl bg-white text-[#1a1a1a] shadow-lg border border-slate-100 flex items-center justify-center hover:bg-[#FF8A75] hover:text-white transition-all group/add"
                           >
                              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                           </button>
                           <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                           {recordings.map((rec) => (
                              <button key={rec.id} onClick={() => window.open(rec.play_url!, '_blank')} className="w-full flex items-center justify-between p-5 rounded-[2rem] bg-white border border-transparent hover:border-[#FF8A75]/20 group transition-all hover:translate-x-1">
                                 <div className="flex items-center gap-5">
                                    <div className="h-10 w-10 rounded-xl bg-[#FF8A75]/5 flex items-center justify-center text-[#FF8A75] group-hover:rotate-12 transition-all"><Play className="w-4 h-4 ml-0.5" /></div>
                                    <p className="text-sm font-bold text-slate-800 tracking-tight">{rec.topic}</p>
                                 </div>
                                 <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-[#FF8A75] transition-all" />
                              </button>
                           ))}
                           {resources.map((res) => (
                              <button key={res.id} onClick={() => window.open(res.file_url, '_blank')} className="w-full flex items-center justify-between p-5 rounded-[2rem] bg-white border border-transparent hover:border-[#FF8A75]/20 group transition-all hover:translate-x-1">
                                 <div className="flex items-center gap-5">
                                    <div className="h-10 w-10 rounded-xl bg-[#FF8A75]/5 flex items-center justify-center text-[#FF8A75] group-hover:rotate-12 transition-all"><FileText className="w-4 h-4" /></div>
                                    <p className="text-sm font-bold text-slate-800 tracking-tight">{res.file_name}</p>
                                 </div>
                                 <Download className="w-5 h-5 text-slate-200 group-hover:text-[#FF8A75] transition-all" />
                              </button>
                           ))}
                        </div>
                     </div>

                  </div>

               </div>

            </main>
         </div>

         {/* Create Batch Modal */}
         {isCreateBatchOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#1a1a1a]/30 backdrop-blur-3xl animate-in zoom-in-95 duration-500">
               <div className="w-full max-w-lg bg-[#FFFAF7] rounded-[4rem] p-16 relative overflow-hidden shadow-2xl shadow-black/20 text-center border border-white/50">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF8A75]/10 rounded-full blur-3xl -translate-y-20 translate-x-20" />

                  <button onClick={() => setIsCreateBatchOpen(false)} className="absolute top-12 right-12 text-[#1a1a1a]/20 hover:text-[#FF8A75] transition-colors"><X className="w-8 h-8" /></button>
                  <h3 className="text-4xl font-serif text-slate-900 mb-2">Manifest Path</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] mb-12">New Collective Node Calibration</p>

                  <div className="space-y-6 relative z-10">
                     <div className="space-y-2 text-left">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF8A75] ml-4">Node Identity</label>
                        <input
                           type="text"
                           placeholder="e.g., Spring Equinox Sanctuary"
                           value={formData.name}
                           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                           className="h-18 w-full px-8 rounded-3xl bg-white border border-[#FF8A75]/10 text-base font-bold text-slate-900 focus:ring-8 focus:ring-[#FF8A75]/5 outline-none transition-all"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 text-left">
                           <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF8A75] ml-4">Cycle Start</label>
                           <input
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                              className="h-18 w-full px-8 rounded-3xl bg-white border border-[#FF8A75]/10 text-base font-bold text-slate-900 focus:ring-8 focus:ring-[#FF8A75]/5 outline-none transition-all"
                           />
                        </div>
                        <div className="space-y-2 text-left">
                           <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF8A75] ml-4">Cycle End</label>
                           <input
                              type="date"
                              value={formData.endDate}
                              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                              className="h-18 w-full px-8 rounded-3xl bg-white border border-[#FF8A75]/10 text-base font-bold text-slate-900 focus:ring-8 focus:ring-[#FF8A75]/5 outline-none transition-all"
                           />
                        </div>
                     </div>

                     <button
                        onClick={handleCreateBatch}
                        className={cn(
                           "w-full h-20 mt-8 rounded-[2.5rem] bg-[#1a1a1a] text-white text-[12px] font-black uppercase tracking-[0.3em] hover:bg-[#FF8A75] shadow-2xl transition-all flex items-center justify-center gap-4 group/submit",
                           isPending && "opacity-50 pointer-events-none"
                        )}
                     >
                        {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                           <>
                              Commit Collective
                              <ArrowRight className="w-5 h-5 group-hover/submit:translate-x-2 transition-transform" />
                           </>
                        )}
                     </button>
                  </div>
               </div>
            </div>
         )}

         <style jsx global>{`
           .no-scrollbar::-webkit-scrollbar { display: none; }
           .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
           .custom-scrollbar::-webkit-scrollbar { width: 5px; }
           .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
           .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,138,117,0.15); border-radius: 10px; }
           .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,138,117,0.3); }
         `}</style>
      </div>
   );
}
