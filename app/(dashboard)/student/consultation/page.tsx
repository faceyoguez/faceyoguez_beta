'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Send, Paperclip, Video, Clock, CheckCircle2,
  User, Loader2, ArrowRight, Sparkles, ExternalLink
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { ConsultationWithDetails, ConsultationMessageWithSender } from '@/types/consultation';
import { ZoomJoinButton } from '@/components/zoom/ZoomJoinButton';

const CONSULTATION_PRICE = 999;

declare global { interface Window { Razorpay: any; } }

export default function StudentConsultationPage() {
  const [consultation, setConsultation] = useState<ConsultationWithDetails | null>(null);
  const [hasCredit, setHasCredit] = useState(false);
  const [messages, setMessages] = useState<ConsultationMessageWithSender[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/consultation/status');
      const data = await res.json();
      setConsultation(data.consultation);
      setHasCredit(data.hasCredit);
    } catch {
      toast.error('Failed to load consultation status');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (consultationId: string) => {
    try {
      const res = await fetch(`/api/consultation/messages?consultationId=${consultationId}`);
      const data = await res.json();
      setMessages(data.messages || []);
      setTimeout(scrollToBottom, 100);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!consultation?.id) return;
    fetchMessages(consultation.id);

    // Realtime subscription
    const channel = supabase
      .channel(`consultation-messages-${consultation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'consultation_messages', filter: `consultation_id=eq.${consultation.id}` },
        async () => {
          await fetchMessages(consultation.id);
        }
      )
      .subscribe();

    // Also watch for status changes
    const statusChannel = supabase
      .channel(`consultation-status-${consultation.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'consultations', filter: `id=eq.${consultation.id}` },
        async () => {
          await fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(statusChannel);
    };
  }, [consultation?.id, supabase, fetchMessages, fetchStatus]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRazorpay = () =>
    new Promise<void>((resolve) => {
      if (window.Razorpay) { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      document.body.appendChild(s);
    });

  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      await loadRazorpay();
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: 'consultation', planVariant: 'personal-consultation', amount: CONSULTATION_PRICE }),
      });
      const data = await res.json();
      
      if (data.error) {
        toast.error('Failed to initiate payment', { description: data.error });
        setPurchasing(false);
        return;
      }
      
      const { orderId, amount, currency, keyId } = data;
      const rzp = new window.Razorpay({
        key: keyId, amount, currency, order_id: orderId,
        name: 'Faceyoguez', description: 'Personal Consultation Session',
        theme: { color: '#FF8A75' },
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, planType: 'consultation', planVariant: 'personal-consultation', amount: CONSULTATION_PRICE }),
          });
          const data = await verifyRes.json();
          if (data.success) {
            toast.success('Consultation booked! 🎉', { description: 'Our team will connect with you very soon.' });
            await fetchStatus();
          } else {
            toast.error('Payment failed', { description: data.error });
          }
          setPurchasing(false);
        },
        modal: { ondismiss: () => setPurchasing(false) },
      });
      rzp.open();
    } catch (err: any) {
      toast.error('Failed to initiate payment');
      setPurchasing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !consultation?.id || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const res = await fetch('/api/consultation/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultationId: consultation.id, content: text, content_type: 'text' }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev: ConsultationMessageWithSender[]) => [...prev, data.message]);
        setTimeout(scrollToBottom, 50);
      }
    } catch {
      toast.error('Failed to send message');
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF8A75]" />
      </div>
    );
  }

  // ── NO CONSULTATION: Show purchase CTA ──────────────────────────
  if (!consultation) {
    return (
      <div className="min-h-full font-jakarta p-4 sm:p-6 lg:p-8 space-y-6">
        <header className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900 tracking-tight">
                    Personal <span className="text-[#FF8A75]">Consultation</span>
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-1">Get 1-on-1 guidance from our expert team</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#FF8A75]/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#FF8A75]" />
            </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-[1.75rem] p-8 sm:p-12 space-y-8 shadow-sm max-w-4xl mx-auto"
        >
          <div className="space-y-4 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#FF8A75]/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-[#FF8A75]" />
            </div>
            <h2 className="text-2xl font-aktiv font-bold text-slate-900">Expert Guidance, Personalized for You</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Share your specific concerns, ask questions, and optionally schedule a private Zoom call to refine your face yoga practice.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: MessageCircle, title: 'Private Chat', desc: 'Direct messaging' },
              { icon: Video, title: 'Zoom Call', desc: 'Face-to-face video' },
              { icon: Sparkles, title: '₹999 Credit', desc: 'Deducted from plans' },
            ].map((item: { icon: any; title: string; desc: string }, i: number) => (
              <div key={i} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-2 text-center">
                <item.icon className="w-5 h-5 text-[#FF8A75] mx-auto" />
                <p className="font-bold text-xs text-slate-900 uppercase tracking-widest">{item.title}</p>
                <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-[#FF8A75] uppercase tracking-[0.2em] mb-1">💰 Smart Investment</p>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Pay ₹999 for consultation. When you buy any 1-on-1 plan after, ₹999 is automatically deducted — making your consultation <span className="text-white">essentially free</span>!
            </p>
          </div>

          <button
            onClick={handlePurchase}
            disabled={purchasing}
            id="purchase-consultation-btn"
            className="w-full h-14 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#FF8A75] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
          >
            {purchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><MessageCircle className="w-5 h-5" /> Book Your Consultation — ₹999</>}
          </button>
        </motion.div>
      </div>
    );
  }

  const status = consultation.status;
  const zoomCall = (consultation as any).zoom_calls?.[0] || (consultation as any).zoom_call;

  // ── STATUS BANNERS ──────────────────────────────────────────
  const StatusBanner = () => {
    if (status === 'paid') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Consultation Pending Activation</p>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">Our team has received your booking and will connect with you very soon. You'll get an email notification when it's active!</p>
          </div>
        </motion.div>
      );
    }
    if (status === 'completed') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-sm">Consultation Complete! 🎉</p>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
              {hasCredit ? 'Your ₹999 credit is still active — use it on any 1-on-1 plan!' : 'Your consultation credit has been applied to your plan. Thank you!'}
            </p>
            {hasCredit && (
              <button
                onClick={() => window.location.href = '/student/plans'}
                className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black text-[#FF8A75] uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                Claim Credit <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </motion.div>
      );
    }
    return null;
  };

  // ── CREDIT CARD ─────────────────────────────────────────────
  const CreditCard = () => {
    if (!hasCredit || status === 'completed') return null;
    return (
      <div className="bg-slate-900 rounded-2xl p-5 flex items-center justify-between border border-slate-800 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8A75]/10 rounded-full blur-3xl -z-10" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#FF8A75]">💰 Credit Available</p>
          <p className="text-lg font-bold text-white">₹999 OFF any 1-on-1 plan</p>
          <p className="text-[11px] text-slate-400 font-medium">Auto-applied on your first purchase</p>
        </div>
        <button
          onClick={() => window.location.href = '/student/plans'}
          className="h-10 px-5 bg-[#FF8A75] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all flex items-center gap-2"
        >
          View Plans <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-full font-jakarta p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900 tracking-tight">
                My <span className="text-[#FF8A75]">Consultation</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
                Status: <span className={`font-black uppercase tracking-widest ${
                status === 'active' ? 'text-emerald-500' :
                status === 'completed' ? 'text-slate-400' :
                'text-amber-500'
                }`}>{status}</span>
            </p>
        </div>
        {zoomCall && status === 'active' && (
          <ZoomJoinButton
            meetingId={zoomCall.id}
            type="consultation"
            className="flex items-center gap-2 h-11 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FF8A75] transition-all shadow-lg shadow-slate-900/10"
          >
            <Video className="w-4 h-4" />
            Join Zoom
          </ZoomJoinButton>
        )}
      </header>

      <StatusBanner />
      <CreditCard />

      {/* Zoom call info */}
      {zoomCall && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-3xl -z-10" />
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">📅 Scheduled Zoom Call</p>
          <div className="space-y-1">
            <p className="text-base font-bold text-slate-900">{zoomCall.topic}</p>
            <p className="text-[11px] text-slate-400 font-medium">
                {new Date(zoomCall.start_time).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at{' '}
                {new Date(zoomCall.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} IST
                {' '}· {zoomCall.duration_minutes} min
            </p>
          </div>
          <ZoomJoinButton meetingId={zoomCall.id} type="consultation"
            className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
            Join this call <ExternalLink className="w-3 h-3" />
          </ZoomJoinButton>
        </div>
      )}

      {/* CHAT AREA */}
      {(status === 'active' || status === 'completed') && (
        <div className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-25rem)] min-h-[500px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-12">
                <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>No messages yet. Say hi! 👋</p>
              </div>
            )}
            {messages.map((msg: ConsultationMessageWithSender) => {
              const isStaff = msg.sender?.role !== 'student';
              const isSystem = msg.content_type === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-full max-w-[80%] text-center whitespace-pre-line leading-relaxed border border-slate-100">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isStaff ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] ${isStaff ? 'order-2' : ''}`}>
                    {isStaff && (
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                        {msg.sender?.full_name?.split(' ')[0] || 'Staff'}
                      </p>
                    )}
                    <div className={`rounded-2xl px-5 py-3.5 text-[13px] font-medium leading-relaxed shadow-sm ${
                      isStaff
                        ? 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-sm'
                        : 'bg-slate-900 text-white rounded-tr-sm'
                    }`}>
                      {msg.content_type === 'pdf' || msg.content_type === 'file' ? (
                        <a href={msg.file_url || '#'} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 underline font-bold">
                          <Paperclip className="w-4 h-4 flex-shrink-0" />
                          {msg.file_name || 'Attachment'}
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    <p className={`text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1.5 ${isStaff ? 'ml-1' : 'text-right mr-1'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {status === 'active' && (
            <div className="border-t border-slate-50 p-5 flex items-end gap-3 bg-white/50 backdrop-blur-md">
              <textarea
                id="consultation-message-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message… (Enter to send)"
                rows={1}
                className="flex-1 resize-none bg-slate-50 rounded-xl px-5 py-3.5 text-sm text-slate-800 font-medium placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#FF8A75]/20 border border-slate-100 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                id="send-message-btn"
                className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-[#FF8A75] transition-all disabled:opacity-50 flex-shrink-0 shadow-lg shadow-slate-900/10"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          )}
          {status === 'completed' && (
            <div className="border-t border-slate-100 p-4 text-center text-xs text-slate-400">
              This consultation has been completed. Check out our plans to continue your journey!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
