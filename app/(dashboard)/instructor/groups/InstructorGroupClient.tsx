'use client';

import { useState, useRef, useTransition, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
   Search, Plus, Users,
   Video, Play,
   FileText, Send, X,
   Download, DownloadCloud, Mail,
   Loader2, ArrowUpRight,
   ArrowRight, ChevronLeft, ChevronRight,   
   Activity, 
   
   ShieldCheck, ShieldAlert,
   MessageSquare, MessageCircle
} from 'lucide-react';
import { createAndPopulateBatch, type CreateBatchInput, toggleBatchChat, getInstructorBatches } from '@/lib/actions/batches';
import { useRouter } from 'next/navigation';
import type { RecordedSession, StudentResource, Profile } from '@/types/database';
import { uploadBatchResource, getBatchResources, uploadResource, getStudentResources } from '@/lib/actions/resources';
import { sendBatchMessage, getBatchMessages, getOrCreateSharedChat } from '@/lib/actions/chat';
import { getBatchRecordedSessions, scheduleGroupSession, getInstructorUpcomingMeetings, startMeeting, completeMeeting } from '@/lib/actions/meetings';
import { getJourneyLogs, type JourneyLog } from '@/lib/actions/journey';
import { ImageComparison } from '@/components/ui/image-comparison-slider';
import { JOURNEY_MAX_DAY } from '@/components/ui/journey-progress';
import { createClient } from '@/lib/supabase/client';
import { cn, formatIST, formatISTDate, formatISTTime, getSessionStatus, localInputToIST } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatWindow } from '@/components/chat';
import { sendDirectStudentEmail } from '@/lib/actions/email';
import JSZip from 'jszip';

interface InstructorGroupClientProps {
   currentUser: Profile;
   initialBatches: any[];
   initialBatchResources: StudentResource[];
   instructors: Profile[];
   waitingQueue: any[];
}

export function InstructorGroupClient({ currentUser, initialBatches, initialBatchResources, instructors, waitingQueue }: InstructorGroupClientProps) {
   const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
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
   const [studentTab, setStudentTab] = useState<'active' | 'waiting'>('active');
   const [studentPage, setStudentPage] = useState(0);
   const STUDENTS_PER_PAGE = 5;

   // Chat State
   const [messages, setMessages] = useState<any[]>([]);
   const [newMessage, setNewMessage] = useState('');
   const [isChatLoading, setIsChatLoading] = useState(false);
   const [chatMode, setChatMode] = useState<'batch' | 'private'>('batch');
   const [studentConversationId, setStudentConversationId] = useState<string | null>(null);
   const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
   const [emailData, setEmailData] = useState({ subject: 'Update on your Face Yoga Journey', body: '' });
   const [isSendingEmail, setIsSendingEmail] = useState(false);
   const [isZipping, setIsZipping] = useState(false);
   const [photoAngle, setPhotoAngle] = useState<'front' | 'left' | 'right'>('front');

   // Meetings State
   const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
   const [now, setNow] = useState(0);
   const [isMounted, setIsMounted] = useState(false);

   useEffect(() => {
       setIsMounted(true);
       setNow(Date.now());
   }, []);

   useEffect(() => {
      getInstructorUpcomingMeetings().then(setUpcomingMeetings).catch(console.error);
      const interval = setInterval(() => setNow(Date.now()), 30000); // Update every 30s
      return () => clearInterval(interval);
   }, []);

   const nextBatchMeeting = useMemo(() => {
      if (!selectedBatch) return null;
      return upcomingMeetings.find(m => m.batch_id === selectedBatch.id) || null;
   }, [upcomingMeetings, selectedBatch]);

   const displayStatus = useMemo(() => {
      if (!nextBatchMeeting) return { text: "No Session", enabled: false };
      const isMeetingLive = nextBatchMeeting.calendar_event_id === 'LIVE';
      const isHost = currentUser.is_master_instructor || currentUser.id === nextBatchMeeting.host_id;
      
      if (isHost) {
         const startTime = new Date(nextBatchMeeting.start_time).getTime();
         const isTimeReady = now >= startTime - 300000;
         return { 
            text: isMeetingLive ? "Join Session" : "Start Session", 
            enabled: isTimeReady 
         };
      } else {
         return {
            text: isMeetingLive ? "Join Session" : "Waiting for Instructor",
            enabled: isMeetingLive
         };
      }
   }, [nextBatchMeeting, now, currentUser]);
   const chatContainerRef = useRef<HTMLDivElement>(null);
   const supabase = createClient();

   // Recordings State
   const [recordings, setRecordings] = useState<RecordedSession[]>([]);
   const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

   // Schedule Session Form
   const [scheduleData, setScheduleData] = useState({
      startTime: '', topic: 'Face Yoga Live Group Session', duration: 60
   });

   // Pagination for batches
   const [batchPage, setBatchPage] = useState(0);
   const BATCHES_PER_PAGE = 5;

   useEffect(() => {
      setBatches(initialBatches);
      const batch = initialBatches.find((b: any) => b.status === 'active') || initialBatches[0] || null;
      setSelectedBatch(batch);
      setResources(initialBatchResources);
      if (batch) fetchRecordings(batch);
   }, [initialBatches, initialBatchResources]);

   useEffect(() => {
      setStudentPage(0);
   }, [studentTab, selectedBatch]);

   useEffect(() => {
      if (!selectedBatch?.id) return;

      const fetchAll = async () => {
         setIsChatLoading(true);
         try {
            const msgs = await getBatchMessages(selectedBatch.id);
            setMessages(msgs);
         } finally {
            setIsChatLoading(false);
         }
      };
      fetchAll();

      const msgChannel = supabase
         .channel(`batch-chat-${selectedBatch.id}`)
         .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'batch_messages', filter: `batch_id=eq.${selectedBatch.id}` },
            async (payload: { new: any }) => {
               // Prevent duplicates
               setMessages((prev: any[]) => {
                  if (prev.some(m => m.id === payload.new.id)) return prev;
                  
                  const fetchAndAppend = async () => {
                     const { data: profile } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, role')
                        .eq('id', payload.new.sender_id)
                        .single();

                     const newMsg = { ...payload.new, sender: profile || { full_name: 'User', role: 'student' } };
                     setMessages((curr) => {
                        if (curr.some(m => m.id === newMsg.id)) return curr;
                        return [...curr, newMsg];
                     });
                  };
                  fetchAndAppend();
                  return prev;
               });
            }
         )
         .subscribe();

      return () => { supabase.removeChannel(msgChannel); };
   }, [selectedBatch?.id, supabase, currentUser.id]);

   useEffect(() => {
      if (!selectedBatch?.id) return;
      
      const meetingChannel = supabase
         .channel(`batch-meetings-${selectedBatch.id}`)
         .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'meetings', filter: `batch_id=eq.${selectedBatch.id}` },
            (payload: any) => {
               setUpcomingMeetings(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
            }
         )
         .subscribe();
      
      return () => { supabase.removeChannel(meetingChannel); };
   }, [selectedBatch?.id, supabase]);

   useEffect(() => {
      if (!selectedStudent?.id) {
         setStudentConversationId(null);
         setJourneyLogs([]);
         return;
      }

      const fetchStudentDetails = async () => {
         setIsLoadingStudent(true);
         try {
            const [logs, conv] = await Promise.all([
               getJourneyLogs(selectedStudent.id),
               getOrCreateSharedChat(selectedStudent.id, selectedStudent.assigned_instructor_id || selectedBatch?.instructor_id)
            ]);
            setJourneyLogs(logs);
            if (conv?.conversationId) setStudentConversationId(conv.conversationId);
         } catch (e) {
            console.error("Failed to fetch student details", e);
         } finally {
            setIsLoadingStudent(false);
         }
      };
      fetchStudentDetails();
   }, [selectedStudent, selectedBatch]);

   useEffect(() => {
      const loadResources = async () => {
         if (chatMode === 'private' && selectedStudent?.id) {
            const studentRes = await getStudentResources(selectedStudent.id);
            setResources(studentRes);
         } else if (selectedBatch?.id) {
            const batchRes = await getBatchResources(selectedBatch.id);
            setResources(batchRes);
         }
      };
      loadResources();
   }, [chatMode, selectedStudent?.id, selectedBatch?.id]);

   useEffect(() => {
      if (chatContainerRef.current) {
         chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
   }, [messages]);

   // â”€â”€â”€ HANDLERS â”€â”€â”€
   const handleSendMessage = async () => {
      if (!newMessage.trim() || !selectedBatch?.id) return;
      
      const content = newMessage.trim();
      setNewMessage('');

      // Optimistic update
      const tempId = crypto.randomUUID();
      const optimisticMsg = {
         id: tempId,
         content,
         sender_id: currentUser.id,
         batch_id: selectedBatch.id,
         created_at: new Date().toISOString(),
         sender: {
            id: currentUser.id,
            full_name: currentUser.full_name,
            avatar_url: currentUser.avatar_url,
            role: currentUser.role
         }
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      const res: any = await sendBatchMessage(selectedBatch.id, content, currentUser.id);
      if (!res.success) {
         toast.error(res.error);
         setMessages((prev) => prev.filter(m => m.id !== tempId));
         setNewMessage(content);
      } else if (res.message) {
         setMessages((prev) => prev.map(m => m.id === tempId ? { ...res.message, sender: optimisticMsg.sender } : m));
      }
   };

   const handleDownloadPhotos = async () => {
      if (!selectedStudent || journeyLogs.length === 0) {
         toast.error("No journey photos found for this student");
         return;
      }

      setIsZipping(true);
      try {
         const zip = new JSZip();
         const folder = zip.folder(`${selectedStudent.full_name}_journey`);
         
         const downloadPromises: Promise<void>[] = [];
         
         journeyLogs.forEach((log) => {
            const angles = [
               { url: log.photo_url, label: 'Front' },
               { url: log.photo_url_left, label: 'Left' },
               { url: log.photo_url_right, label: 'Right' }
            ];

            angles.forEach((angle) => {
               if (angle.url) {
                  const p = (async () => {
                     try {
                        const response = await fetch(angle.url!);
                        const blob = await response.blob();
                        const extension = angle.url!.split('.').pop()?.split('?')[0] || 'jpg';
                        folder?.file(`Day-${log.day_number}-${angle.label}.${extension}`, blob);
                     } catch (e) {
                        console.error(`Failed to download image for day ${log.day_number} [${angle.label}]`, e);
                     }
                  })();
                  downloadPromises.push(p);
               }
            });
         });
         
         if (downloadPromises.length === 0) {
            toast.error("No photos available to download");
            setIsZipping(false);
            return;
         }

         await Promise.all(downloadPromises);
         
         const content = await zip.generateAsync({ type: "blob" });
         const url = window.URL.createObjectURL(content);
         const link = document.createElement('a');
         link.href = url;
         link.download = `${selectedStudent.full_name.replace(/\s+/g, '_')}_Journey_Photos.zip`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         window.URL.revokeObjectURL(url);
         
         toast.success("Photos bundled and downloaded!");
      } catch (err) {
         console.error(err);
         toast.error("Failed to generate zip file");
      } finally {
         setIsZipping(false);
      }
   };

   const handleSendDirectEmail = async () => {
      if (!selectedStudent?.email) {
         toast.error("Student doesn't have an email address");
         return;
      }
      if (!emailData.body.trim()) {
         toast.error("Please enter a message");
         return;
      }

      setIsSendingEmail(true);
      try {
         const res = await sendDirectStudentEmail(selectedStudent.email, emailData.subject, emailData.body);
         if (res.success) {
            toast.success("Email sent from simrat@faceyoguez.com");
            setIsEmailModalOpen(false);
            setEmailData({ subject: 'Update on your Face Yoga Journey', body: '' });
         } else {
            toast.error(res.error || "Failed to send email");
         }
      } catch (err) {
         toast.error("An error occurred while sending email");
      } finally {
         setIsSendingEmail(false);
      }
   };

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
         const reader = new FileReader();
         reader.readAsDataURL(file);
         reader.onload = async () => {
            try {
               const base64 = (reader.result as string).split(',')[1];
               if (chatMode === 'private' && selectedStudent) {
                  const res = await uploadResource(selectedStudent.id, file.name, file.type, file.size, base64);
                  if (res.success) {
                     const updated = await getStudentResources(selectedStudent.id);
                     setResources(updated);
                     toast.success('Resource shared privately!');
                  } else {
                     toast.error(res.error || 'Failed to share resource');
                  }
               } else {
                  if (!selectedBatch) return;
                  const res = await uploadBatchResource(selectedBatch.id, file.name, file.type, file.size, base64);
                  if (res.success) {
                     const updated = await getBatchResources(selectedBatch.id);
                     setResources(updated);
                     toast.success('Resource shared with batch!');
                  } else {
                     toast.error(res.error || 'Failed to share resource');
                  }
               }
            } catch (err) {
               console.error(err);
               toast.error('Upload failed. Please try again.');
            } finally {
               setIsUploading(false);
            }
         };
         reader.onerror = () => {
            toast.error('Failed to read file');
            setIsUploading(false);
         };
      } catch (err) {
         console.error(err);
         toast.error('Upload failed. Please try again.');
         setIsUploading(false);
      }
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

   const handleScheduleSession = async () => {
      if (!scheduleData.startTime || !selectedBatch?.id) {
         toast.error("Please select a date and time."); return;
      }
      startTransition(async () => {
         try {
            // Convert the local datetime-local value to an IST-offset ISO string
            // e.g. "2026-07-07T19:30" → "2026-07-07T19:30:00+05:30"
            const istStartTime = localInputToIST(scheduleData.startTime);
            const res = await scheduleGroupSession(selectedBatch.id, istStartTime, scheduleData.topic, scheduleData.duration);
            if (res) {
               toast.success("Session scheduled & invites sent!");
               setIsScheduleModalOpen(false);
               setScheduleData({ startTime: '', topic: 'Face Yoga Live Group Session', duration: 60 });
               router.refresh();
            }
         } catch (e: any) {
            toast.error(e.message || "Failed to schedule session");
         }
      });
   };

   const filteredBatches = useMemo(() => {
      return batches.filter((b: any) => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
   }, [batches, searchQuery]);

   const activeStudents = useMemo(() => selectedBatch?.batch_enrollments?.map((e: any) => ({
      ...e.student,
      subscription: e.subscription,
      // Note: batch_enrollments has no created_at column — use the student's profile created_at
      // as a proxy for when they joined, available via e.student.created_at (spread above as student.created_at)
   })) || [], [selectedBatch]);

   const normalizedWaitingQueue = useMemo(() => (waitingQueue || []).map((q: any) => ({
      ...q.student,
      enrolled_at: q.requested_at,
      queue_id: q.id,
      isWaiting: true
   })), [waitingQueue]);

   const displayStudents = useMemo(() => {
      let base = studentTab === 'active' ? activeStudents : normalizedWaitingQueue;
      
      // Deduplicate by ID + status
      const seen = new Set();
      base = base.filter((s: any) => {
         const key = `${s.id}-${s.isWaiting ? 'waiting' : 'active'}`;
         if (seen.has(key)) return false;
         seen.add(key);
         return true;
      });

      // Calculate days remaining
      const now = new Date();
      now.setHours(0,0,0,0);
      base = base.map((s: any) => {
         let daysLeft = 999;
         if (s.subscription?.end_date) {
            const end = new Date(s.subscription.end_date);
            end.setHours(0,0,0,0);
            const diff = end.getTime() - now.getTime();
            daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
         }
         return { ...s, daysLeft };
      });

      if (searchQuery) {
         const q = searchQuery.toLowerCase();
         base = base.filter((s: any) => 
            s.full_name?.toLowerCase().includes(q) || 
            s.email?.toLowerCase().includes(q)
         );
      }

      // Sort: priority to plans expiring in 0-5 days
      return [...base].sort((a: any, b: any) => {
         const aExpiring = a.daysLeft >= 0 && a.daysLeft <= 5;
         const bExpiring = b.daysLeft >= 0 && b.daysLeft <= 5;
         
         if (aExpiring && !bExpiring) return -1;
         if (!aExpiring && bExpiring) return 1;
         if (aExpiring && bExpiring) return a.daysLeft - b.daysLeft;
         
         // Fallback: recent first
         const aDate = new Date(a.enrolled_at || a.subscription?.start_date || a.created_at || 0).getTime();
         const bDate = new Date(b.enrolled_at || b.subscription?.start_date || b.created_at || 0).getTime();
         return bDate - aDate;
      });
   }, [studentTab, activeStudents, normalizedWaitingQueue, searchQuery]);

   const totalStudentPages = Math.ceil(displayStudents.length / STUDENTS_PER_PAGE);
   const paginatedStudents = displayStudents.slice(studentPage * STUDENTS_PER_PAGE, (studentPage + 1) * STUDENTS_PER_PAGE);

   // Transformation Derived Data
   const day1Log = journeyLogs.find((l: any) => l.day_number === 1);
   // Priority: subscription.start_date > student.created_at (profile join date) > null
   // We deliberately do NOT fall back to selectedBatch?.start_date because that is the batch program
   // start date (e.g. 2026-03-01) which would show inflated day counts for recently joined students.
   const studentStartDate = selectedStudent
      ? (selectedStudent.subscription?.start_date || selectedStudent.created_at || null)
      : null;
   const currentDayNumber = studentStartDate
      ? Math.min(JOURNEY_MAX_DAY, Math.max(1, Math.floor((Date.now() - new Date(studentStartDate).getTime()) / 86400000) + 1))
      : 1;
   const activeLog = journeyLogs.find((l: any) => l.day_number === currentDayNumber);

   // Days since student joined
   const daysSinceJoined = studentStartDate
      ? Math.max(0, Math.floor((Date.now() - new Date(studentStartDate).getTime()) / 86400000))
      : 0;

   // Angle-aware image picker (falls back to placeholder)
   const PLACEHOLDER = 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100';
   const getAngleUrl = (log: any, angle: 'front' | 'left' | 'right') => {
      if (!log) return PLACEHOLDER;
      if (angle === 'left') return log.photo_url_left || log.photo_url || PLACEHOLDER;
      if (angle === 'right') return log.photo_url_right || log.photo_url || PLACEHOLDER;
      return log.photo_url || PLACEHOLDER;
   };
   const beforeImage = getAngleUrl(day1Log, photoAngle);
   const afterImage = getAngleUrl(activeLog, photoAngle);

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
               </div>
            </header>

            <main className="flex-1 flex flex-col overflow-hidden">

               {/* ðŸ—ºï¸ Batch Session Row (Active Batches & Join Session ) */}
               <div className="shrink-0 h-20 px-6 lg:px-12 bg-white/20 backdrop-blur-md border-b border-[#FF8A75]/5 flex items-center justify-between z-50">
                  <div className="flex items-center gap-6 min-w-0 overflow-hidden">
                     <span className="hidden xl:block text-[9px] font-black uppercase tracking-[0.4em] text-[#FF8A75] shrink-0">Global Group Session</span>
                     
                     {/* Student Actions Group */}
                     <div className="flex items-center gap-3 pl-6 border-l border-[#FF8A75]/10 animate-in fade-in slide-in-from-left-4 duration-500">
                        <span className="hidden sm:block text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 shrink-0">Student Actions:</span>
                        <div className={cn("flex items-center gap-2 transition-opacity duration-300", !selectedStudent && "opacity-30 grayscale pointer-events-none")}>
                           <a 
                              href={selectedStudent?.phone ? `https://wa.me/${selectedStudent.phone.replace(/\D/g, '')}` : "#"} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="h-9 w-9 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all shadow-sm border border-[#25D366]/10"
                              title={selectedStudent?.phone ? "Chat on WhatsApp" : "No phone number available"}
                           >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                           </a>
                           <button
                              onClick={() => setIsEmailModalOpen(true)}
                              className="h-9 px-4 rounded-xl bg-[#EA4335]/10 text-[#EA4335] hover:bg-[#EA4335] hover:text-white flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all border border-[#EA4335]/10 shadow-sm"
                              title="Send Email from simrat@faceyoguez.com"
                           >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                 <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.573l8.073-6.08c1.618-1.214 3.927-.059 3.927 1.964z"/>
                              </svg>
                              <span className="hidden md:inline">Gmail</span>
                           </button>
                           <button
                              onClick={handleDownloadPhotos}
                              disabled={isZipping}
                              className="h-9 px-4 rounded-xl bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all border border-purple-500/10 shadow-sm disabled:opacity-50"
                              title="Download all journey photos as ZIP"
                           >
                              {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                              <span className="hidden md:inline">Photos</span>
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 shrink-0">
                     {nextBatchMeeting && (() => {
                        const status = getSessionStatus(nextBatchMeeting.start_time, nextBatchMeeting.duration_minutes || 60, nextBatchMeeting.calendar_event_id);
                        return (
                        <div className="text-left sm:text-right flex flex-col items-start sm:items-end min-w-0 gap-1">
                           <div className="flex items-center gap-2">
                              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[#FF8A75]">Next Live Session</span>
                              {status === 'expired' && <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Expired</span>}
                              {status === 'completed' && <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Completed</span>}
                              {status === 'live' && <span className="text-[7px] font-black uppercase tracking-widest text-[#FF8A75] bg-[#FF8A75]/10 px-1.5 py-0.5 rounded-full animate-pulse">Live</span>}
                           </div>
                           <h4 className={cn("text-[11px] font-bold truncate max-w-[180px] sm:max-w-[220px]", status === 'expired' ? 'line-through text-slate-400' : status === 'completed' ? 'text-slate-500' : 'text-slate-800')}>{nextBatchMeeting.topic}</h4>
                           <p className="text-[9px] font-medium text-slate-500">
                              {formatISTDate(nextBatchMeeting.start_time)} · {formatISTTime(nextBatchMeeting.start_time)} IST
                           </p>
                        </div>
                        );
                     })()}
                     <div className="flex items-center gap-2 flex-wrap">
                        <button
                           onClick={() => setIsScheduleModalOpen(true)}
                           disabled={!selectedBatch}
                           className="h-10 px-6 rounded-xl bg-white border border-[#FF8A75]/20 text-[#FF8A75] text-[9px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-[#FF8A75]/5 disabled:opacity-30 transition-all duration-300"
                        >
                           <Video className="w-4 h-4" />
                           Schedule Session
                        </button>
                        <button
                        disabled={!displayStatus.enabled}
                        onClick={async () => {
                           if (!nextBatchMeeting) return;
                           const isHost = currentUser.is_master_instructor || currentUser.id === nextBatchMeeting.host_id;
                           const isLive = nextBatchMeeting.calendar_event_id === 'LIVE';

                           if (isHost && !isLive) {
                              const res = await startMeeting(nextBatchMeeting.id);
                              if (!res.success) {
                                 toast.error("Failed to start session");
                                 return;
                              }
                              toast.success("Session is now LIVE!");
                           }

                           const url = isHost 
                              ? nextBatchMeeting.start_url 
                              : nextBatchMeeting.join_url;
                           window.open(url, '_blank');
                        }}
                        className={cn(
                           "h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-500 group/btn",
                           displayStatus.enabled
                              ? "bg-[#FF8A75] text-white hover:bg-[#ff7a63] shadow-[0_0_20px_rgba(255,138,117,0.4)] hover:shadow-[0_0_30px_rgba(255,138,117,0.6)] hover:-translate-y-0.5" 
                              : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                        )}
                     >
                        <div className={cn("h-2 w-2 rounded-full", (displayStatus.enabled || nextBatchMeeting?.calendar_event_id === 'LIVE') ? "bg-white animate-pulse" : "bg-slate-300")} />
                        {displayStatus.text}
                        {displayStatus.enabled && <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />}
                     </button>
                     {/* Mark Complete button — visible when session is LIVE or in its active window */}
                     {nextBatchMeeting && nextBatchMeeting.calendar_event_id === 'LIVE' && (currentUser.is_master_instructor || currentUser.id === nextBatchMeeting.host_id) && (
                        <button
                           onClick={async () => {
                              const res = await completeMeeting(nextBatchMeeting.id);
                              if (res.success) {
                                 toast.success('Session marked as completed!');
                                 router.refresh();
                              } else {
                                 toast.error('Failed to mark complete');
                              }
                           }}
                           className="h-10 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-all"
                        >
                           ✓ Mark Complete
                        </button>
                     )}
                  </div>
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
                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">{chatMode === 'batch' ? 'Group Chat' : 'Private Chat'}</h3>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Messages are live</p>
                                 </div>
                                 {!selectedBatch?.is_chat_enabled && chatMode === 'batch' && (
                                    <div className="px-3 py-1 rounded-full bg-red-50 border border-red-100 flex items-center gap-2">
                                       <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                       <span className="text-[8px] font-bold uppercase tracking-widest text-red-500">Chat Disabled</span>
                                    </div>
                                 )}
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button 
                                       onClick={() => setChatMode('batch')}
                                       className={cn(
                                          "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                                          chatMode === 'batch' ? "bg-white text-[#FF8A75] shadow-sm" : "text-slate-400 hover:text-slate-600"
                                       )}
                                    >
                                       <Users className="w-3 h-3" />
                                       Batch
                                    </button>
                                    <button 
                                       onClick={() => {
                                          if (!selectedStudent) {
                                             toast.error("Select a student to chat privately");
                                             return;
                                          }
                                          setChatMode('private');
                                       }}
                                       className={cn(
                                          "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                                          chatMode === 'private' ? "bg-white text-[#FF8A75] shadow-sm" : "text-slate-400 hover:text-slate-600"
                                       )}
                                    >
                                       <MessageCircle className="w-3 h-3" />
                                       Private
                                    </button>
                                 </div>
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
                           <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                              {chatMode === 'batch' ? (
                                 <>
                                    <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto mb-4 custom-scrollbar pr-3">
                                       {isChatLoading ? (
                                          <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-50">
                                             <Loader2 className="w-6 h-6 animate-spin text-[#FF8A75]" />
                                             <p className="text-[10px] font-bold uppercase tracking-widest">Loading Conversation...</p>
                                          </div>
                                       ) : messages.length === 0 ? (
                                          <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-30">
                                             <MessageSquare className="w-8 h-8 text-slate-300" />
                                             <p className="text-[10px] font-bold uppercase tracking-widest">No messages yet</p>
                                          </div>
                                       ) : (
                                          messages.map((msg: any) => {
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
                                                         <span className="text-[10px] font-bold text-slate-800 leading-none mb-1">{sender?.full_name || 'User'}</span>
                                                         {roleLabel && <span className="text-[8px] font-bold uppercase tracking-widest text-[#FF8A75] leading-none">{roleLabel}</span>}
                                                      </div>
                                                   )}
                                                   <div className={cn(
                                                      "px-4 py-2.5 rounded-2xl text-[13px] font-medium max-w-[85%] leading-relaxed shadow-sm",
                                                      isMe ? "bg-[#FF8A75] text-white rounded-tr-none shadow-[#FF8A75]/10" : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none"
                                                   )}>
                                                      {msg.content}
                                                   </div>
                                                   <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                                      {isMounted ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                   </span>
                                                </div>
                                             );
                                          })
                                       )}
                                    </div>

                                    <div className="relative mt-auto shrink-0 group border-t border-slate-100 pt-4">
                                       <input
                                          type="text"
                                          value={newMessage}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
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
                                 </>
                              ) : (
                                 <div className="flex-1 min-h-0 bg-white/10">
                                    {studentConversationId ? (
                                       <ChatWindow
                                          key={studentConversationId}
                                          conversationId={studentConversationId}
                                          currentUser={currentUser}
                                          conversationType="direct"
                                          title={selectedStudent?.full_name}
                                          otherParticipant={selectedStudent}
                                          className="h-full"
                                          hideHeader={true}
                                          isMultiParty={true}
                                       />
                                    ) : (
                                       <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20">
                                          <Loader2 className="w-10 h-10 mb-4 animate-spin" />
                                          <p className="text-[10px] font-aktiv font-bold uppercase tracking-widest">Initializing Student Chat...</p>
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        </div>
                                       {/* Student Register */}
                        <div className="w-full lg:flex-[0.35] flex flex-col min-h-[300px] bg-white rounded-3xl border border-[#FF8A75]/10 shadow-sm p-4 lg:p-5">
                           <div className="flex flex-col mb-4">
                              <div className="flex items-center justify-between px-2 mb-3">
                                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Student Register</h3>
                                 <span className="px-3 py-1 rounded-full bg-[#FF8A75]/5 text-[10px] font-black text-[#FF8A75] border border-[#FF8A75]/10">{displayStudents.length}</span>
                              </div>
                              {waitingQueue && waitingQueue.length > 0 && (
                                 <div className="flex items-center gap-2 px-2 bg-slate-50 p-1 rounded-xl">
                                    <button 
                                       onClick={() => setStudentTab('active')}
                                       className={cn("flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-all", studentTab === 'active' ? "bg-white text-[#FF8A75] shadow-sm" : "text-slate-400 hover:text-slate-600")}
                                    >
                                       Active
                                    </button>
                                    <button 
                                       onClick={() => setStudentTab('waiting')}
                                       className={cn("flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-all", studentTab === 'waiting' ? "bg-white text-[#FF8A75] shadow-sm" : "text-slate-400 hover:text-slate-600")}
                                    >
                                       New ({waitingQueue.length})
                                    </button>
                                 </div>
                              )}
                           </div>

                           <div className="flex-1 overflow-y-auto custom-scrollbar">
                              {paginatedStudents.map((student: any, i: number) => {
                                 const isSelected = selectedStudent?.id === student.id;
                                 let planBadge = null;
                                 let expiringNote = null;
                                 if (student.subscription) {
                                    if (student.subscription.status === 'expired' || (student.daysLeft !== undefined && student.daysLeft < 0)) {
                                       planBadge = <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 mt-1 inline-block">Expired</span>;
                                    } else {
                                       if (student.daysLeft !== undefined && student.daysLeft === 0) {
                                          planBadge = <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1 inline-block">Expires Today</span>;
                                       } else if (student.daysLeft !== undefined && student.daysLeft <= 5) {
                                          planBadge = <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1 inline-block">Expiring Soon</span>;
                                          expiringNote = <div className="text-[9px] font-bold text-red-500 mt-1 animate-pulse">Plan expiring in {student.daysLeft} days</div>;
                                       } else {
                                          planBadge = <span className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75] bg-[#FF8A75]/5 px-2 py-0.5 rounded-full border border-[#FF8A75]/10 mt-1 inline-block">Active</span>;
                                       }
                                    }
                                 } else if (student.isWaiting) {
                                    planBadge = <span className="text-[8px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 mt-1 inline-block">New Student</span>;
                                 }
                                 return (
                                    <button
                                       key={`${student.id}-${student.isWaiting ? 'waiting' : 'active'}-${i}`}
                                       onClick={() => {
                                          setSelectedStudent(student);
                                          setChatMode('private');
                                       }}
                                       className={cn(
                                          "w-full p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 group mb-2",
                                          isSelected
                                             ? "bg-[#FFFAF7] border-[#FF8A75]/30 shadow-sm ring-2 ring-[#FF8A75]/5"
                                             : "bg-white border-slate-100 hover:border-[#FF8A75]/10 hover:bg-slate-50"
                                       )}
                                    >
                                       <div className="flex items-center gap-3 min-w-0">
                                          <div className="h-10 w-10 rounded-xl overflow-hidden ring-[2px] ring-white shadow-sm bg-slate-50 shrink-0">
                                             {student.avatar_url ? (
                                                <img src={student.avatar_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                             ) : (
                                                <div className="h-full w-full flex items-center justify-center text-lg font-aktiv font-bold text-[#FF8A75]">{student.full_name ? student.full_name[0] : 'S'}</div>
                                             )}
                                          </div>
                                          <div className="text-left min-w-0 flex flex-col justify-center items-start">
                                             <div className="flex items-center gap-2">
                                                <p className="text-[13px] text-slate-800 truncate leading-none capitalize font-bold">{student.full_name || 'Student'}</p>
                                                {student.daysLeft <= 5 && student.daysLeft >= 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-ping shrink-0" />}
                                             </div>
                                             {planBadge}
                                             {expiringNote}
                                          </div>
                                       </div>
                                    </button>
                                 );
                              })}
                           </div>

                           {totalStudentPages > 1 && (
                              <div className="flex items-center justify-between mt-4 px-2 pt-4 border-t border-[#FF8A75]/10 shrink-0">
                                 <button
                                    onClick={() => setStudentPage(Math.max(0, studentPage - 1))}
                                    disabled={studentPage === 0}
                                    className="h-8 px-4 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-[#FF8A75]/10 hover:text-[#FF8A75] transition-all"
                                 >
                                    Prev
                                 </button>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Page {studentPage + 1} of {totalStudentPages}
                                 </span>
                                 <button
                                    onClick={() => setStudentPage(Math.min(totalStudentPages - 1, studentPage + 1))}
                                    disabled={studentPage === totalStudentPages - 1}
                                    className="h-8 px-4 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-[#FF8A75]/10 hover:text-[#FF8A75] transition-all"
                                 >
                                    Next
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>

                  </div>

                  {/* RIGHT MAJOR PANE (Focus - 35%) */}
                  <div className="w-full lg:flex-[0.35] flex flex-col gap-4 lg:gap-6 min-w-0 pb-24 lg:pb-0">

                     {/* Seeker Focus (Transformation Mirror) */}
                     <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col gap-4 shrink-0 min-h-[350px]">
                        {/* Header */}
                        <div className="flex items-center justify-between relative z-10">
                           <div className="space-y-1">
                              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{selectedStudent?.full_name || 'Progress Tracker'}</h3>
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75]">Before/After Progress</p>
                           </div>
                           {selectedStudent && (
                              <div className="flex items-center gap-2">
                                 {/* Days passed tag */}
                                 <div className="h-8 px-3 rounded-xl bg-slate-800 flex items-center gap-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white">Day</span>
                                    <span className="text-[13px] font-black text-[#FF8A75] leading-none">{daysSinceJoined}</span>
                                 </div>
                                 <div className="h-8 px-4 rounded-xl bg-[#FF8A75]/5 flex items-center gap-2 border border-[#FF8A75]/10">
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#FF8A75]">Focused</span>
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* Angle Navbar */}
                        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                           {(['front', 'left', 'right'] as const).map((angle) => (
                              <button
                                 key={angle}
                                 onClick={() => setPhotoAngle(angle)}
                                 className={cn(
                                    "flex-1 h-8 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                                    photoAngle === angle
                                       ? "bg-white text-[#FF8A75] shadow-sm border border-[#FF8A75]/10"
                                       : "text-slate-400 hover:text-slate-600"
                                 )}
                              >
                                 {angle}
                              </button>
                           ))}
                        </div>

                        {/* Photo comparison */}
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
                           {resources.map((res: StudentResource) => (
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
         {isScheduleModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-[#1a1a1a]/30 backdrop-blur-md animate-in zoom-in-95 duration-200">
               <div className="w-full max-w-lg bg-white rounded-3xl p-8 lg:p-10 relative overflow-y-auto max-h-screen shadow-2xl">
                  <button onClick={() => setIsScheduleModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-[#FF8A75] transition-colors"><X className="w-6 h-6" /></button>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">Schedule Live Session</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8A75] mb-8">For {selectedBatch?.name}</p>

                  <div className="space-y-5">
                     <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 ml-2">Session Topic</label>
                        <input
                           type="text"
                           value={scheduleData.topic}
                           onChange={(e) => setScheduleData({ ...scheduleData, topic: e.target.value })}
                           className="h-14 w-full px-6 rounded-2xl bg-white border border-[#FF8A75]/10 text-base font-bold text-slate-900 focus:ring-8 focus:ring-[#FF8A75]/5 outline-none transition-all"
                        />
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                           <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 ml-2">Date & Time</label>
                           <input
                              type="datetime-local"
                              value={scheduleData.startTime}
                              onChange={(e) => setScheduleData({ ...scheduleData, startTime: e.target.value })}
                              className="h-12 w-full px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#FF8A75]/20 outline-none transition-all"
                           />
                        </div>
                        <div className="space-y-1.5 text-left">
                           <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 ml-2">Duration (mins)</label>
                           <select
                              value={scheduleData.duration}
                              onChange={(e) => setScheduleData({ ...scheduleData, duration: parseInt(e.target.value) })}
                              className="h-12 w-full px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#FF8A75]/20 outline-none transition-all"
                           >
                              <option value={30}>30 Minutes</option>
                              <option value={45}>45 Minutes</option>
                              <option value={60}>60 Minutes</option>
                              <option value={90}>90 Minutes</option>
                           </select>
                        </div>
                     </div>

                     <button
                        onClick={handleScheduleSession}
                        className={cn(
                           "w-full h-14 mt-6 rounded-xl bg-[#1a1a1a] text-white text-[12px] font-bold uppercase tracking-widest hover:bg-[#FF8A75] shadow-md transition-all flex items-center justify-center gap-3 group/submit",
                           isPending && "opacity-50 pointer-events-none"
                        )}
                     >
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                           <>
                              Schedule & Notify Students
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
                              {chatMode === 'batch' ? 'Group Chat' : 'Private Chat'} <span className="flex h-2 w-2 relative rounded-full bg-emerald-500"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span></span>
                           </h3>
                           <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#FF8A75] opacity-80">Messages are live</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="flex bg-white/5 p-1 rounded-xl">
                              <button 
                                 onClick={() => setChatMode('batch')}
                                 className={cn(
                                    "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                                    chatMode === 'batch' ? "bg-white text-[#FF8A75]" : "text-white/40 hover:text-white"
                                 )}
                              >
                                 Batch
                              </button>
                              <button 
                                 onClick={() => {
                                    if (!selectedStudent) {
                                       toast.error("Select a student to chat privately");
                                       return;
                                    }
                                    setChatMode('private');
                                 }}
                                 className={cn(
                                    "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                                    chatMode === 'private' ? "bg-white text-[#FF8A75]" : "text-white/40 hover:text-white"
                                 )}
                              >
                                 Private
                              </button>
                           </div>
                           <button onClick={() => setIsMobileChatOpen(false)} className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all shadow-lg border border-white/10">
                              <X className="w-5 h-5" />
                           </button>
                        </div>
                     </div>
                  
                  {/* Messages Area */}
                  <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar p-6">
                      {chatMode === 'batch' ? (
                         messages.map((msg: any) => {
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
                         })
                      ) : (
                         <div className="h-full flex flex-col">
                            {studentConversationId ? (
                               <ChatWindow
                                  key={studentConversationId}
                                  conversationId={studentConversationId}
                                  currentUser={currentUser}
                                  conversationType="direct"
                                  title={selectedStudent?.full_name}
                                  otherParticipant={selectedStudent}
                                  className="h-full"
                                  hideHeader={true}
                                  isMultiParty={true}
                               />
                            ) : (
                               <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20">
                                  <Loader2 className="w-10 h-10 mb-4 animate-spin text-white" />
                                  <p className="text-[10px] font-aktiv font-bold uppercase tracking-widest text-white">Initializing Private Chat...</p>
                               </div>
                            )}
                         </div>
                      )}
                  </div>

                  {/* Input Area */}
                  {chatMode === 'batch' && (
                     <div className="relative p-6 bg-black/50 backdrop-blur-xl border-t border-white/10 shrink-0 mb-4 focus-within:mb-0 transition-all">
                        <input
                           type="text"
                           value={newMessage}
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
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
                  )}
               </motion.div>
               </>
            )}
         </AnimatePresence>

         {/* Direct Email Modal */}
         {isEmailModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl relative">
                  <button onClick={() => setIsEmailModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-[#FF8A75]"><X className="w-5 h-5" /></button>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600"><Mail className="w-5 h-5" /></div>
                     <div>
                        <h3 className="text-xl font-bold text-slate-900">Direct Message</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sending to {selectedStudent?.full_name}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Subject</label>
                        <input 
                           type="text"
                           value={emailData.subject}
                           onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                           className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Message Body</label>
                        <textarea 
                           value={emailData.body}
                           onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                           placeholder="Type your message here..."
                           className="w-full h-40 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all resize-none"
                        />
                     </div>

                     <button
                        onClick={handleSendDirectEmail}
                        disabled={isSendingEmail}
                        className="w-full h-14 rounded-2xl bg-[#1a1a1a] text-white text-[12px] font-bold uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-blue-500/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                        {isSendingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                           <>
                              Send from simrat@faceyoguez.com
                              <Send className="w-4 h-4" />
                           </>
                        )}
                     </button>
                  </div>
               </div>
            </div>
         )}

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

