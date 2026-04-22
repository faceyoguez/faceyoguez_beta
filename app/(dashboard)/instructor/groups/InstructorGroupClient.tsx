'use client';

import { useState, useRef, useTransition, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
   Search, Plus, Users,
   Video, Play,
   FileText, Send, X,
   Download, 
   Loader2, ArrowUpRight,
   ArrowRight, ChevronLeft, ChevronRight,   
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
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

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
   const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

   // Create Batch Form
   const [formData, setFormData] = useState<Partial<CreateBatchInput>>({
      name: '', startDate: '', endDate: '', maxStudents: 30, instructorId: currentUser.id
   });

   // Pagination for batches
   const [batchPage, setBatchPage] = useState(0);
   const BATCHES_PER_PAGE = 5;

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

   const activeStudents = selectedBatch?.batch_enrollments?.map((e: any) => ({
      ...e.student,
      subscription: e.subscription
   })) || [];

   // Transformation Derived Data
   const day1Log = journeyLogs.find(l => l.day_number === 1);
   const activeLog = journeyLogs.find(l => l.day_number === (selectedStudent ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(selectedBatch?.start_date || Date.now()).getTime()) / 86400000) + 1)) : 1));
   const beforeImage = day1Log?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
   const afterImage = activeLog?.photo_url || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800';

   return (
      <div className="flex flex-col h-screen bg-[#FFFAF7] text-[#1a1a1a] selection:bg-[#FF8A75]/10 overflow-hidden font-jakarta animate-in fade-in duration-1000 relative">

         {/* Kinetic Aura Background */}
         <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-[#FF8A75]/10 rounded-full blur-[140px] opacity-60" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-[#FF6B4E]/5 rounded-full blur-[140px] opacity-40" />
         </div>

         <div className="relative z-10 flex flex-col h-full overflow-hidden">

            {/* Header (Title + Search + Create) */}
            <header className="shrink-0 h-24 px-6 lg:px-12 flex items-center justify-between border-b border-[#FF8A75]/10 bg-white/40 backdrop-blur-3xl">
               <div className="flex items-center gap-4 lg:gap-6">
                  <div className="h-10 w-1.5 bg-[#FF8A75] rounded-full shadow-[0_0_12px_#FF8A75]" />
                  <div>
                     <h1 className="text-3xl font-aktiv font-bold tracking-tight text-[#1a1a1a]">Batch Portal</h1>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] mt-1 opacity-60">Admin Desk</p>
                  </div>
               </div>

               <div className="flex items-center gap-4 lg:gap-8">
                  <div className="relative group w-40 lg:w-80">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#FF8A75] transition-colors" />
                     <input
                        type="text"
                        placeholder="Search students..."
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

               {/* 🗺️ Batch Session Row (Active Batches & Join Session ) */}
               <div className="shrink-0 h-20 px-6 lg:px-12 bg-white/20 backdrop-blur-md border-b border-[#FF8A75]/5 flex items-center justify-between z-50">
                  <div className="flex items-center gap-4 min-w-0 overflow-hidden">
                     <span className="hidden xl:block text-[9px] font-black uppercase tracking-[0.4em] text-[#FF8A75] shrink-0">Batches List:</span>
                     
                     <div className="flex items-center gap-2 overflow-hidden">
                        {filteredBatches.slice(batchPage * BATCHES_PER_PAGE, (batchPage + 1) * BATCHES_PER_PAGE).map((batch: any) => {
                           const isSelected = selectedBatch?.id === batch.id;
                           return (
                              <button
                                 key={batch.id}
                                 onClick={() => handleBatchClick(batch)}
                                 className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all shrink-0 border whitespace-nowrap group",
                                    isSelected
                                       ? "bg-white border-[#FF8A75]/30 shadow-md ring-2 ring-[#FF8A75]/5"
                                       : "bg-transparent border-transparent opacity-40 hover:opacity-100"
                                 )}
                              >
                                 <div className={cn(
                                    "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
                                    isSelected ? "bg-[#FF8A75] text-white rotate-6" : "bg-[#FF8A75]/10 text-[#FF8A75] group-hover:rotate-6"
                                 )}>
                                    <Users className="w-3 h-3" />
                                 </div>
                                 <p className={cn("text-[10px] font-bold tracking-tight", isSelected ? "text-slate-900" : "text-slate-400")}>{batch.name}</p>
                              </button>
                           );
                        })}
                     </div>

                     {filteredBatches.length > BATCHES_PER_PAGE && (
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                           <button 
                              onClick={() => setBatchPage(p => Math.max(0, p - 1))}
                              disabled={batchPage === 0}
                              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/50 border border-[#FF8A75]/10 hover:bg-white disabled:opacity-30"
                           >
                              <ChevronLeft className="w-4 h-4 text-[#FF8A75]" />
                           </button>
                           <button 
                              onClick={() => setBatchPage(p => p + 1)}
                              disabled={(batchPage + 1) * BATCHES_PER_PAGE >= filteredBatches.length}
                              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/50 border border-[#FF8A75]/10 hover:bg-white disabled:opacity-30"
                           >
                              <ChevronRight className="w-4 h-4 text-[#FF8A75]" />
                           </button>
                        </div>
                     )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                     <button
                        onClick={() => window.open('/instructor/broadcast', '_blank')}
                        className="h-10 px-6 rounded-xl bg-[#1a1a1a] text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-[#FF8A75] shadow-lg shadow-[#1a1a1a]/10 transition-all duration-500 group/btn"
                     >
                        <div className="h-2 w-2 rounded-full bg-[#FF8A75] animate-pulse group-hover:bg-white" />
                        Join Live Session
                        <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                     </button>
                  </div>
               </div>

               <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto overflow-x-hidden p-4 lg:p-8 pt-4 lg:pt-6 gap-4 lg:gap-6 custom-scrollbar relative pb-24 lg:pb-12">

                  {/* LEFT MAJOR PANE (Master - 65%) */}
                  <div className="w-full lg:flex-[0.65] flex flex-col gap-4 lg:gap-6 min-w-0">

                     {/* 2. Collective Interaction (Chat | Roster Split) */}
                     <div className="flex-1 min-h-[500px] flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-visible">

                        {/* Chat UI */}
                        <div className="hidden lg:flex flex-[0.65] bg-white rounded-3xl p-6 flex-col relative shadow-sm border border-slate-100">
                           <div className="flex items-center justify-between mb-4 shrink-0 border-b border-slate-100 pb-4">
                              <div className="flex items-center gap-4">
                                 <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Group Chat</h3>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Messages are live</p>
                                 </div>
                                 {!selectedBatch?.is_chat_enabled && (
                                    <div className="px-3 py-1 rounded-full bg-red-50 border border-red-100 flex items-center gap-2">
                                       <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                       <span className="text-[8px] font-bold uppercase tracking-widest text-red-500">Chat Disabled</span>
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
                                          toast.success(newStatus ? 'Chat Enabled' : 'Chat Disabled');
                                          const updatedBatches = await getInstructorBatches(currentUser.id);
                                          setBatches(updatedBatches);
                                          const current = updatedBatches.find((b: any) => b.id === selectedBatch.id);
                                          if (current) setSelectedBatch(current);
                                       }
                                    }}
                                    className={cn(
                                       "h-9 px-4 rounded-xl flex items-center gap-2 transition-all text-[9px] font-bold uppercase tracking-widest border",
                                       selectedBatch?.is_chat_enabled
                                          ? "bg-slate-50 border-slate-200 text-slate-500 hover:text-[#FF8A75] hover:border-[#FF8A75]/30 hover:bg-white"
                                          : "bg-[#FF8A75] border-[#FF8A75] text-white shadow-sm shadow-[#FF8A75]/30"
                                    )}
                                 >
                                    {selectedBatch?.is_chat_enabled ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                    {selectedBatch?.is_chat_enabled ? "Enabled" : "Disabled"}
                                 </button>
                              </div>
                           </div>
                           <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto mb-4 custom-scrollbar pr-3">
                               {messages.map((msg) => {
                                  const isMe = msg.sender_id === currentUser.id;
                                  const sender = msg.sender || {};
                                  const roles: Record<string, string> = {
                                     admin: 'Admin',
                                     instructor: 'Instructor',
                                     staff: 'Staff',
                                     client_management: 'Staff'
                                  };
                                  const roleLabel = roles[sender.role] || (msg.sender_id === selectedBatch?.instructor_id ? 'Instructor' : null);

                                  return (
                                     <div key={msg.id} className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                                        {!isMe && (
                                           <div className="flex flex-col ml-2">
                                              <span className="text-[10px] font-bold text-slate-800 leading-none mb-1">{sender?.full_name}</span>
                                              {roleLabel && <span className="text-[8px] font-bold uppercase tracking-widest text-[#FF8A75] leading-none">{roleLabel}</span>}
                                           </div>
                                        )}
                                       <div className={cn(
                                          "px-4 py-2.5 rounded-2xl text-[13px] font-medium max-w-[85%] leading-relaxed shadow-sm",
                                          isMe
                                             ? "bg-[#FF8A75] text-white rounded-tr-none shadow-[#FF8A75]/10"
                                             : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none"
                                       )}>
                                          {msg.content}
                                       </div>
                                    </div>
                                  );
                               })}
                           </div>

                           <div className="relative mt-auto shrink-0 group border-t border-slate-100 pt-4">
                              <input
                                 type="text"
                                 value={newMessage}
                                 onChange={(e) => setNewMessage(e.target.value)}
                                 onKeyDown={(e) => e.key === 'Enter' && selectedBatch?.is_chat_enabled && handleSendMessage()}
                                 placeholder={selectedBatch?.is_chat_enabled ? "Type a message..." : "Chat is disabled"}
                                 disabled={!selectedBatch?.is_chat_enabled}
                                 className={cn(
                                    "w-full h-12 rounded-2xl border-none pl-6 pr-14 text-sm font-medium transition-all outline-none",
                                    selectedBatch?.is_chat_enabled
                                       ? "bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#FF8A75]/20 focus:outline outline-slate-200"
                                       : "bg-slate-50 text-slate-400 cursor-not-allowed"
                                 )}
                              />
                              <button
                                 onClick={handleSendMessage}
                                 disabled={!selectedBatch?.is_chat_enabled}
                                 className={cn(
                                    "absolute right-2 top-[calc(50%+8px)] -translate-y-1/2 h-8 w-8 rounded-xl flex items-center justify-center transition-all transform active:scale-90",
                                    selectedBatch?.is_chat_enabled
                                       ? "bg-[#FF8A75] text-white hover:bg-[#FF6B4E] shadow-md shadow-[#FF8A75]/20"
                                       : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                 )}
                              >
                                 <Send className="w-4 h-4" />
                              </button>
                           </div>
                        </div>

                        {/* Student Register */}
                        <div className="w-full lg:flex-[0.35] flex flex-col min-h-[300px] bg-white rounded-3xl border border-[#FF8A75]/10 shadow-sm p-4 lg:p-5">
                           <div className="flex items-center justify-between mb-4 px-2">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Student Register</h3>
                              <span className="px-3 py-1 rounded-full bg-[#FF8A75]/5 text-[10px] font-black text-[#FF8A75] border border-[#FF8A75]/10">{activeStudents.length}</span>
                           </div>
                           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                              {activeStudents.map((student: any) => {
                                 const isSelected = selectedStudent?.id === student.id;
                                 let planBadge = null;
                                 if (student.subscription) {
                                    if (student.subscription.status === 'expired') {
                                       planBadge = <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 mt-1 inline-block">Expired</span>;
                                    } else if (student.subscription.status === 'active' && student.subscription.end_date) {
                                       const end = new Date(student.subscription.end_date);
                                       const todayAtMidnight = new Date();
                                       todayAtMidnight.setHours(0,0,0,0);
                                       
                                       const diffTime = end.getTime() - todayAtMidnight.getTime();
                                       const daysLeftValue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                                       if (daysLeftValue < 0) {
                                          planBadge = <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 mt-1 inline-block">Expired</span>;
                                       } else if (daysLeftValue === 0) {
                                          planBadge = <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1 inline-block">Expires Today</span>;
                                       } else if (daysLeftValue <= 5) {
                                          planBadge = <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1 inline-block">Expiring in {daysLeftValue} {daysLeftValue === 1 ? 'Day' : 'Days'}</span>;
                                       } else {
                                          planBadge = <span className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75] bg-[#FF8A75]/5 px-2 py-0.5 rounded-full border border-[#FF8A75]/10 mt-1 inline-block">Active</span>;
                                       }
                                    }
                                 }
                                 return (
                                    <button
                                       key={student.id}
                                       onClick={() => setSelectedStudent(student)}
                                       className={cn(
                                          "w-full p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 group",
                                          isSelected
                                             ? "bg-[#FFFAF7] border-[#FF8A75]/30 shadow-sm ring-2 ring-[#FF8A75]/5"
                                             : "bg-transparent border-transparent hover:bg-slate-50 hover:shadow-sm"
                                       )}
                                    >
                                       <div className="flex items-center gap-3 min-w-0">
                                          <div className="h-10 w-10 rounded-xl overflow-hidden ring-[2px] ring-white shadow-sm bg-slate-50 shrink-0">
                                             {student.avatar_url ? (
                                                <img src={student.avatar_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                             ) : (
                                               <div className="h-full w-full flex items-center justify-center text-lg font-aktiv font-bold text-[#FF8A75]">{student.full_name[0]}</div>
                                             )}
                                          </div>
                                          <div className="text-left min-w-0 flex flex-col justify-center items-start">
                                             <p className="text-[13px] text-slate-800 truncate leading-none capitalize">{student.full_name}</p>
                                             {planBadge}
                                          </div>
                                       </div>
                                       {student.phone && (
                                          <a 
                                             href={`https://wa.me/${student.phone.replace(/\D/g, '')}`} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             onClick={(e) => e.stopPropagation()}
                                             className="h-8 w-8 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all shrink-0 outline-none hover:rotate-12"
                                             title="Chat on WhatsApp"
                                          >
                                             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                             </svg>
                                          </a>
                                       )}
                                    </button>
                                 );
                              })}
                           </div>
                        </div>

                     </div>

                  </div>

                  {/* RIGHT MAJOR PANE (Focus - 35%) */}
                  <div className="w-full lg:flex-[0.35] flex flex-col gap-4 lg:gap-6 min-w-0 pb-24 lg:pb-0">

                     {/* Seeker Focus (Transformation Mirror) */}
                     <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col gap-6 shrink-0 min-h-[350px]">
                        <div className="flex items-center justify-between relative z-10">
                           <div className="space-y-1">
                              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{selectedStudent?.full_name || 'Progress Tracker'}</h3>
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Before/After Progress</p>
                           </div>
                           {selectedStudent && (
                              <div className="h-8 px-4 rounded-xl bg-[#FF8A75]/5 flex items-center gap-2 border border-[#FF8A75]/10">
                                 <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                                 <span className="text-[9px] font-bold uppercase tracking-widest text-[#FF8A75]">Focused</span>
                              </div>
                           )}
                        </div>

                        <div className="flex-1 rounded-2xl bg-slate-50 overflow-hidden relative border border-slate-100 group/mirror">
                           {selectedStudent ? (
                              <ImageComparison beforeImage={beforeImage} afterImage={afterImage} />
                           ) : (
                              <div className="h-full flex flex-col items-center justify-center opacity-40">
                                 <Activity className="w-10 h-10 text-slate-400 mb-3" />
                                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select a student</p>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Registry Chronicles (Resources) */}
                     <div className="flex-1 bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm flex flex-col min-h-[300px]">
                        <div className="flex items-center justify-between mb-6 shrink-0 px-2 lg:mt-2">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Shared Documents</h3>
                           <button
                              onClick={() => fileInputRef.current?.click()}
                              className="h-8 w-8 rounded-xl bg-slate-50 text-slate-600 shadow-sm border border-slate-200 flex items-center justify-center hover:bg-[#FF8A75] hover:text-white transition-all group/add"
                           >
                              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                           </button>
                           <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                           {recordings.map((rec) => (
                              <button key={rec.id} onClick={() => window.open(rec.play_url!, '_blank')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#FF8A75]/30 group transition-all hover:bg-white">
                                 <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#FF8A75]"><Play className="w-3.5 h-3.5 ml-0.5" /></div>
                                    <p className="text-[13px] font-bold text-slate-700 tracking-tight">{rec.topic}</p>
                                 </div>
                                 <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#FF8A75] transition-all" />
                              </button>
                           ))}
                           {resources.map((res) => (
                              <button key={res.id} onClick={() => window.open(res.file_url, '_blank')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#FF8A75]/30 group transition-all hover:bg-white">
                                 <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#FF8A75]"><FileText className="w-3.5 h-3.5" /></div>
                                    <p className="text-[13px] font-bold text-slate-700 tracking-tight">{res.file_name}</p>
                                 </div>
                                 <Download className="w-4 h-4 text-slate-300 group-hover:text-[#FF8A75] transition-all" />
                              </button>
                           ))}
                        </div>
                     </div>

                  </div>

               </div>

            </main>
         </div>

         {isCreateBatchOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-[#1a1a1a]/30 backdrop-blur-md animate-in zoom-in-95 duration-200">
               <div className="w-full max-w-lg bg-white rounded-3xl p-8 lg:p-10 relative overflow-y-auto max-h-screen shadow-2xl">
                  <button onClick={() => setIsCreateBatchOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-[#FF8A75] transition-colors"><X className="w-6 h-6" /></button>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">Create New Batch</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8A75] mb-8">Setup new group batch</p>

                  <div className="space-y-5">
                     <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 ml-2">Batch Name</label>
                        <input
                           type="text"
                           placeholder="e.g., Spring Equinox Sanctuary"
                           value={formData.name}
                           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                           className="h-16 lg:h-18 w-full px-6 lg:px-8 rounded-3xl bg-white border border-[#FF8A75]/10 text-base font-bold text-slate-900 focus:ring-8 focus:ring-[#FF8A75]/5 outline-none transition-all"
                        />
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                           <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 ml-2">Start Date</label>
                           <input
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                              className="h-12 w-full px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#FF8A75]/20 focus:border-[#FF8A75]/50 outline-none transition-all"
                           />
                        </div>
                        <div className="space-y-1.5 text-left">
                           <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 ml-2">End Date</label>
                           <input
                              type="date"
                              value={formData.endDate}
                              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                              className="h-12 w-full px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#FF8A75]/20 focus:border-[#FF8A75]/50 outline-none transition-all"
                           />
                        </div>
                     </div>

                     <button
                        onClick={handleCreateBatch}
                        className={cn(
                           "w-full h-14 mt-6 rounded-xl bg-[#1a1a1a] text-white text-[12px] font-bold uppercase tracking-widest hover:bg-[#FF8A75] shadow-md transition-all flex items-center justify-center gap-3 group/submit",
                           isPending && "opacity-50 pointer-events-none"
                        )}
                     >
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                           <>
                              Create Batch
                              <ArrowRight className="w-4 h-4 group-hover/submit:translate-x-1 transition-transform" />
                           </>
                        )}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* MOBILE FAB FOR CHAT */}
         <button 
            onClick={() => setIsMobileChatOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 h-16 w-16 rounded-[2rem] bg-black text-[#FF8A75] flex items-center justify-center shadow-2xl z-40 border border-white/10 hover:scale-105 transition-transform"
         >
            <MessageSquare className="w-6 h-6" />
            {selectedBatch?.is_chat_enabled && (
               <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-black"></span>
               </span>
            )}
         </button>

      {/* MOBILE CHAT OVERLAY */}
         <AnimatePresence>
            {isMobileChatOpen && (
               <>
                  <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
                     onClick={() => setIsMobileChatOpen(false)}
                  />
                  <motion.div 
                     initial={{ y: "100%" }}
                     animate={{ y: 0 }}
                     exit={{ y: "100%" }}
                     transition={{ type: "spring", damping: 25, stiffness: 200 }}
                     className="fixed inset-x-0 bottom-0 top-[10%] z-[100] bg-black flex flex-col lg:hidden rounded-t-[2rem] border-t border-white/10 shadow-2xl overflow-hidden"
                  >
                     <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                        <div className="space-y-1">
                           <h3 className="text-xl font-aktiv font-bold text-white tracking-tight flex items-center gap-3">
                              Group Chat <span className="flex h-2 w-2 relative rounded-full bg-emerald-500"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span></span>
                           </h3>
                           <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#FF8A75] opacity-80">Messages are live</p>
                        </div>
                        <button onClick={() => setIsMobileChatOpen(false)} className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all shadow-lg border border-white/10">
                           <X className="w-5 h-5" />
                        </button>
                     </div>
                  
                  {/* Messages Area */}
                  <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar p-6">
                     {messages.map((msg) => {
                        const isMe = msg.sender_id === currentUser.id;
                        const sender = msg.sender || {};
                        const roles: Record<string, string> = { admin: 'Admin', instructor: 'Instructor', staff: 'Staff', client_management: 'Staff' };
                        const roleLabel = roles[sender.role] || (msg.sender_id === selectedBatch?.instructor_id ? 'Instructor' : null);

                        return (
                           <div key={msg.id} className={cn("flex flex-col gap-2", isMe ? "items-end" : "items-start")}>
                              {!isMe && (
                                 <div className="flex flex-col ml-4">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF8A75] leading-none mb-1">{sender?.full_name}</span>
                                    {roleLabel && <span className="text-[7px] font-black uppercase tracking-[0.1em] text-[#FF8A75]/40 leading-none">{roleLabel}</span>}
                                 </div>
                              )}
                              <div className={cn(
                                 "px-5 py-3 rounded-2xl text-[13px] font-medium max-w-[85%] leading-relaxed shadow-lg border border-white/5",
                                 isMe
                                    ? "bg-[#FF8A75] text-white rounded-tr-none shadow-[#FF8A75]/20"
                                    : "bg-white/10 text-white/90 rounded-tl-none backdrop-blur-xl"
                              )}>
                                 {msg.content}
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  {/* Input Area */}
                  <div className="relative p-6 bg-black/50 backdrop-blur-xl border-t border-white/10 shrink-0 mb-4 focus-within:mb-0 transition-all">
                     <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && selectedBatch?.is_chat_enabled && handleSendMessage()}
                        placeholder={selectedBatch?.is_chat_enabled ? "Type a message..." : "Chat disabled"}
                        disabled={!selectedBatch?.is_chat_enabled}
                        className={cn(
                           "w-full h-12 rounded-2xl border-none pl-6 pr-14 text-sm font-medium transition-all outline-none",
                           selectedBatch?.is_chat_enabled
                              ? "bg-white/10 text-white placeholder:text-white/20 focus:bg-white/15 focus:ring-2 focus:ring-[#FF8A75]/20"
                              : "bg-white/[0.02] text-white/10 placeholder:text-white/5 cursor-not-allowed"
                        )}
                     />
                     <button
                        onClick={handleSendMessage}
                        disabled={!selectedBatch?.is_chat_enabled}
                        className={cn(
                           "absolute right-8 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full text-white flex items-center justify-center transition-all transform active:scale-90",
                           selectedBatch?.is_chat_enabled
                              ? "bg-[#FF8A75] hover:bg-[#FF6B4E] shadow-xl shadow-[#FF8A75]/40"
                              : "bg-white/5 text-white/10 cursor-not-allowed"
                        )}
                     >
                        <Send className="w-4 h-4" />
                     </button>
                  </div>
               </motion.div>
               </>
            )}
         </AnimatePresence>

         <style dangerouslySetInnerHTML={{ __html: `
           .no-scrollbar::-webkit-scrollbar { display: none; }
           .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
           .custom-scrollbar::-webkit-scrollbar { width: 5px; }
           .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
           .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,138,117,0.15); border-radius: 10px; }
           .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,138,117,0.3); }
         `}} />
      </div>
   );
}
