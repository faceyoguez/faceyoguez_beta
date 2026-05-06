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
        setMessages(prev => [...prev, data.message]);
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF8A75]" />
      </div>
    );
  }

  // ── NO CONSULTATION: Show purchase CTA ──────────────────────────
  if (!consultation) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personal Consultation</h1>
          <p className="text-slate-500 mt-1">Chat with our face yoga expert, ask your questions, and get a Zoom call.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#fff5f0] to-[#fff] border border-[#FF8A75]/20 rounded-3xl p-8 space-y-6"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FF8A75]/10 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-[#FF8A75]" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Book Your Personal Consultation</h2>
            <p className="text-slate-600 mt-2 leading-relaxed">
              Get a private 1-on-1 consultation with our team. Share your concerns, ask your questions, and optionally schedule a Zoom call.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: MessageCircle, title: 'Private Chat', desc: 'Direct messaging with our expert' },
              { icon: Video, title: 'Zoom Call', desc: 'Schedule a face-to-face video call' },
              { icon: Sparkles, title: '₹999 Credit', desc: 'Deducted from your first 1-on-1 plan' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[#FF8A75]/10 space-y-2">
                <item.icon className="w-5 h-5 text-[#FF8A75]" />
                <p className="font-bold text-sm text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800">💰 Smart Investment</p>
            <p className="text-sm text-amber-700 mt-1">
              Pay ₹999 for consultation. When you buy any 1-on-1 plan after, ₹999 is automatically deducted — making your consultation essentially free!
            </p>
          </div>

          <button
            onClick={handlePurchase}
            disabled={purchasing}
            id="purchase-consultation-btn"
            className="w-full py-4 bg-[#FF8A75] text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-[#FF7A62] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF8A75]/20"
          >
            {purchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><MessageCircle className="w-5 h-5" /> Book Consultation — ₹999</>}
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Consultation Pending Activation</p>
            <p className="text-amber-700 text-xs mt-0.5">Our team has received your booking and will connect with you very soon. You'll get an email notification when it's active!</p>
          </div>
        </motion.div>
      );
    }
    if (status === 'completed') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-800 text-sm">Consultation Complete! 🎉</p>
            <p className="text-emerald-700 text-xs mt-0.5">
              {hasCredit ? 'Your ₹999 credit is still active — use it on any 1-on-1 plan!' : 'Your consultation credit has been applied to your plan. Thank you!'}
            </p>
            {hasCredit && (
              <button
                onClick={() => window.location.href = '/student/plans'}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 underline hover:text-emerald-900 transition-colors"
              >
                Claim ₹999 credit on a plan <ArrowRight className="w-3 h-3" />
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
      <div className="bg-gradient-to-r from-[#FF8A75]/10 to-[#fff5f0] border border-[#FF8A75]/20 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#FF8A75]">💰 Credit Available</p>
          <p className="text-lg font-bold text-slate-900">₹999 OFF any 1-on-1 plan</p>
          <p className="text-xs text-slate-500">Auto-applied on your first plan purchase</p>
        </div>
        <button
          onClick={() => window.location.href = '/student/plans'}
          className="px-4 py-2 bg-[#FF8A75] text-white rounded-xl text-xs font-bold hover:bg-[#FF7A62] transition-colors flex items-center gap-1"
        >
          View Plans <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Consultation</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Status: <span className={`font-semibold capitalize ${
              status === 'active' ? 'text-emerald-600' :
              status === 'completed' ? 'text-blue-600' :
              'text-amber-600'
            }`}>{status}</span>
          </p>
        </div>
        {zoomCall && status === 'active' && (
          <a
            href={zoomCall.join_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            <Video className="w-4 h-4" />
            Join Zoom
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <StatusBanner />
      <CreditCard />

      {/* Zoom call info */}
      {zoomCall && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">📅 Scheduled Zoom Call</p>
          <p className="text-sm font-bold text-blue-900">{zoomCall.topic}</p>
          <p className="text-xs text-blue-700">
            {new Date(zoomCall.start_time).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at{' '}
            {new Date(zoomCall.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} IST
            {' '}· {zoomCall.duration_minutes} min
          </p>
          <a href={zoomCall.join_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 underline">
            {zoomCall.join_url} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* CHAT AREA */}
      {(status === 'active' || status === 'completed') && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '400px', maxHeight: '550px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-12">
                <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>No messages yet. Say hi! 👋</p>
              </div>
            )}
            {messages.map((msg) => {
              const isStaff = msg.sender?.role !== 'student';
              const isSystem = msg.content_type === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-[#FF8A75]/10 text-[#c96b5a] text-xs px-4 py-2 rounded-full max-w-[80%] text-center whitespace-pre-line leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isStaff ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] ${isStaff ? 'order-2' : ''}`}>
                    {isStaff && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
                        {msg.sender?.full_name?.split(' ')[0] || 'Staff'}
                      </p>
                    )}
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isStaff
                        ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                        : 'bg-[#FF8A75] text-white rounded-tr-sm'
                    }`}>
                      {msg.content_type === 'pdf' || msg.content_type === 'file' ? (
                        <a href={msg.file_url || '#'} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 underline font-semibold">
                          <Paperclip className="w-4 h-4 flex-shrink-0" />
                          {msg.file_name || 'Attachment'}
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    <p className={`text-[10px] text-slate-400 mt-1 ${isStaff ? 'ml-1' : 'text-right mr-1'}`}>
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
            <div className="border-t border-slate-100 p-4 flex items-end gap-3">
              <textarea
                id="consultation-message-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message… (Enter to send)"
                rows={2}
                className="flex-1 resize-none bg-slate-50 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#FF8A75]/30 border border-slate-200"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                id="send-message-btn"
                className="w-11 h-11 rounded-2xl bg-[#FF8A75] text-white flex items-center justify-center hover:bg-[#FF7A62] transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
