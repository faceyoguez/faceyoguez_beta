'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, MessageCircle, Video, CheckCircle2, Clock, Send, Paperclip,
  Loader2, Copy, ExternalLink, Phone, ChevronRight, Bell, Mail
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ConsultationUser {
  id: string; full_name: string; email: string; phone?: string; avatar_url?: string;
}
interface ZoomCall {
  id: string; join_url: string; start_time: string; duration_minutes: number; topic: string;
}
interface Message {
  id: string; consultation_id: string; sender_id: string; content: string | null;
  content_type: string; file_url?: string | null; file_name?: string | null;
  is_read: boolean; created_at: string;
  sender?: { id: string; full_name: string; role: string; avatar_url?: string };
}
interface ConsultationItem {
  id: string; student_id: string; status: string; paid_at: string;
  activated_at?: string; completed_at?: string; notes?: string;
  unread_count: number;
  latest_message?: Message;
  student?: ConsultationUser;
  zoom_call?: ZoomCall;
}

export default function StaffConsultationsPage() {
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [selected, setSelected] = useState<ConsultationItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'waiting' | 'active' | 'completed'>('waiting');
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomDate, setZoomDate] = useState('');
  const [zoomTime, setZoomTime] = useState('');
  const [zoomDuration, setZoomDuration] = useState(30);
  const [zoomLoading, setZoomLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchQueue = useCallback(async () => {
    const statusMap = { waiting: 'paid', active: 'active', completed: 'completed' };
    const res = await fetch(`/api/consultation/queue?status=${statusMap[tab]}`);
    const data = await res.json();
    setConsultations(data.consultations || []);
    setLoading(false);
  }, [tab]);

  const fetchMessages = useCallback(async (consultationId: string) => {
    const res = await fetch(`/api/consultation/messages?consultationId=${consultationId}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  useEffect(() => {
    if (!selected?.id) return;
    fetchMessages(selected.id);
    const ch = supabase.channel(`staff-chat-${selected.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultation_messages', filter: `consultation_id=eq.${selected.id}` },
        () => fetchMessages(selected.id))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selected?.id, supabase, fetchMessages]);

  const handleActivate = async (c: ConsultationItem) => {
    const res = await fetch('/api/consultation/activate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId: c.id }),
    });
    const data = await res.json();
    if (data.success) { toast.success(`Consultation activated for ${c.student?.full_name}!`); fetchQueue(); setSelected(null); }
    else toast.error(data.error);
  };

  const handleSend = async () => {
    if (!input.trim() || !selected?.id || sending) return;
    const text = input.trim(); setInput(''); setSending(true);
    const res = await fetch('/api/consultation/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId: selected.id, content: text, content_type: 'text' }),
    });
    const data = await res.json();
    if (data.message) { setMessages(prev => [...prev, data.message]); setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50); }
    else { toast.error('Failed to send'); setInput(text); }
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !selected?.id) return;
    setFileUploading(true);
    try {
      const fileName = `consultation/${selected.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error } = await supabase.storage.from('chat-attachments').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(fileName);
      await fetch('/api/consultation/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultationId: selected.id, content_type: 'pdf', file_url: publicUrl, file_name: file.name, file_size: file.size }),
      });
      toast.success('File sent!');
    } catch { toast.error('Upload failed'); } finally { setFileUploading(false); }
  };

  const handleCreateZoom = async () => {
    if (!selected?.id || !zoomDate || !zoomTime) { toast.error('Please select date and time'); return; }
    setZoomLoading(true);
    const startTime = new Date(`${zoomDate}T${zoomTime}:00`).toISOString();
    const res = await fetch('/api/consultation/zoom', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId: selected.id, startTime, durationMinutes: zoomDuration }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Zoom meeting created! Email sent to student.');
      setShowZoomModal(false);
      if (data.whatsappUrl) {
        navigator.clipboard.writeText(data.joinUrl).then(() => toast.info('Join link copied to clipboard!'));
        window.open(data.whatsappUrl, '_blank');
      }
      fetchQueue();
      if (selected.id) fetchMessages(selected.id);
    } else { toast.error(data.error || 'Failed to create Zoom'); }
    setZoomLoading(false);
  };

  const handleComplete = async () => {
    if (!selected?.id) return;
    setCompleteLoading(true);
    const res = await fetch('/api/consultation/complete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId: selected.id, notes: completeNotes }),
    });
    const data = await res.json();
    if (data.success) { toast.success('Consultation marked complete! Nudge email sent.'); setShowCompleteModal(false); setSelected(null); fetchQueue(); }
    else toast.error(data.error);
    setCompleteLoading(false);
  };

  const tabLabels = { waiting: 'Waiting', active: 'Active', completed: 'Completed' };
  const tabCount = consultations.length;

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden relative">
      {/* Sidebar list */}
      <div className={`lg:w-80 flex-shrink-0 lg:border-r border-slate-100 flex flex-col ${selected ? 'hidden lg:flex' : 'flex w-full flex-1'}`}>
        <div className="p-5 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-900">Consultation Queue</h1>
          <div className="flex gap-1 mt-3">
            {(['waiting', 'active', 'completed'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setSelected(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${tab === t ? 'bg-[#FF8A75] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                {tabLabels[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : consultations.length === 0 ? (
            <div className="text-center p-8 text-slate-400 text-sm">No consultations here</div>
          ) : consultations.map(c => (
            <button key={c.id} onClick={() => { setSelected(c); fetchMessages(c.id); }}
              className={`w-full p-4 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected?.id === c.id ? 'bg-[#FF8A75]/5 border-l-2 border-l-[#FF8A75]' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#FF8A75]/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#FF8A75]">
                    {c.student?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{c.student?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400 truncate">{c.latest_message?.content || 'No messages yet'}</p>
                  </div>
                </div>
                {c.unread_count > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FF8A75] text-white text-[10px] font-black flex items-center justify-center">
                    {c.unread_count > 9 ? '9+' : c.unread_count}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 ml-11">
                {new Date(c.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main panel */}
      {!selected ? (
        <div className="hidden lg:flex flex-1 items-center justify-center text-slate-400">
          <div className="text-center">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a consultation to view</p>
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex flex-col ${!selected ? 'hidden lg:flex' : 'flex'}`}>
          {/* Mobile Back Button */}
          <div className="lg:hidden p-3 border-b border-slate-100 flex items-center bg-slate-50">
            <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-slate-600 font-bold text-sm hover:text-slate-900 transition-colors">
              <ChevronLeft className="w-5 h-5" /> Back to Queue
            </button>
          </div>
          {/* Consultation header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF8A75]/10 flex items-center justify-center text-[#FF8A75] font-bold">
                {selected.student?.full_name?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900">{selected.student?.full_name}</p>
                <p className="text-xs text-slate-400">{selected.student?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selected.student?.phone && (
                <a href={`tel:${selected.student.phone}`} className="p-2 text-slate-400 hover:text-slate-700 transition-colors" title="Call Student">
                  <Phone className="w-4 h-4" />
                </a>
              )}
              {selected.student?.email && (
                <a 
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${selected.student.email}&su=${encodeURIComponent('Face Yoga Consultation')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  title="Send Gmail"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {selected.status === 'paid' && (
                <button onClick={() => handleActivate(selected)}
                  className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors">
                  ✅ Activate
                </button>
              )}
              {selected.status === 'active' && (
                <>
                  <button onClick={() => setShowZoomModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">
                    <Video className="w-3.5 h-3.5" /> Schedule Zoom
                  </button>
                  <button onClick={() => setShowCompleteModal(true)}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors">
                    Mark Complete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Active Zoom info */}
          {selected.zoom_call && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-700">📅 Zoom: {new Date(selected.zoom_call.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {new Date(selected.zoom_call.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                <p className="text-xs text-blue-600 truncate">{selected.zoom_call.join_url}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(selected.zoom_call!.join_url); toast.success('Link copied!'); }}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                <a href={`https://wa.me/${selected.student?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${selected.student?.full_name?.split(' ')[0]}! Your Zoom link: ${selected.zoom_call.join_url}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-xs font-bold">WhatsApp</a>
                <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${selected.student?.email}&su=${encodeURIComponent('Your Zoom Session Link')}&body=${encodeURIComponent(`Hi ${selected.student?.full_name?.split(' ')[0]},\n\nHere is your Zoom link for our session: ${selected.zoom_call.join_url}\n\nSee you there!`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-bold">Gmail</a>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map(msg => {
              const isStaff = msg.sender?.role !== 'student';
              const isSystem = msg.content_type === 'system';
              if (isSystem) return (
                <div key={msg.id} className="flex justify-center">
                  <div className="bg-slate-100 text-slate-500 text-xs px-4 py-2 rounded-full max-w-[80%] text-center whitespace-pre-line">{msg.content}</div>
                </div>
              );
              return (
                <div key={msg.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${isStaff ? 'bg-[#FF8A75] text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                    {msg.content_type === 'pdf' || msg.content_type === 'file' ? (
                      <a href={msg.file_url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline font-semibold">
                        <Paperclip className="w-4 h-4" />{msg.file_name || 'File'}
                      </a>
                    ) : <p className="whitespace-pre-wrap">{msg.content}</p>}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {selected.status === 'active' && (
            <div className="border-t border-slate-100 p-4 flex items-end gap-3 bg-white">
              <input type="file" ref={fileRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" />
              <button onClick={() => fileRef.current?.click()} disabled={fileUploading}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#FF8A75] hover:border-[#FF8A75]/30 transition-colors flex-shrink-0">
                {fileUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </button>
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Message the student…" rows={2}
                className="flex-1 resize-none bg-slate-50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#FF8A75]/30 border border-slate-200" />
              <button onClick={handleSend} disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl bg-[#FF8A75] text-white flex items-center justify-center hover:bg-[#FF7A62] transition-colors disabled:opacity-50 flex-shrink-0">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Zoom Modal */}
      {showZoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md space-y-5 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">Schedule Zoom Call</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date</label>
                <input type="date" value={zoomDate} onChange={e => setZoomDate(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF8A75]/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time (IST)</label>
                <input type="time" value={zoomTime} onChange={e => setZoomTime(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF8A75]/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Duration (minutes)</label>
                <select value={zoomDuration} onChange={e => setZoomDuration(Number(e.target.value))}
                  className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF8A75]/30">
                  {[15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-500">📧 Student will receive an email with the Zoom link. A WhatsApp share link will also open automatically.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowZoomModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleCreateZoom} disabled={zoomLoading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {zoomLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Video className="w-4 h-4" /> Create Zoom</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md space-y-5 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">Complete Consultation</h2>
            <p className="text-sm text-slate-600">Add a personal note for the student — this will appear in their post-consultation email.</p>
            <textarea value={completeNotes} onChange={e => setCompleteNotes(e.target.value)}
              placeholder="E.g. 'We discussed your jawline definition concerns and drooping eyelids…'" rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF8A75]/30 resize-none" />
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3">⚠️ This will send a warm nudge email to the student about buying a 1-on-1 plan with their ₹999 credit.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCompleteModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">Cancel</button>
              <button onClick={handleComplete} disabled={completeLoading}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {completeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '✅ Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
