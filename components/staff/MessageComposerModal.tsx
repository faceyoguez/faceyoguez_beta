'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Loader2, AlertOctagon, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendManagementEmail, sendManagementWhatsApp } from '@/app/actions/staffMessaging';
import { toast } from 'sonner';

interface MessageComposerModalProps {
  open: boolean;
  onClose: () => void;
  channel: 'email' | 'whatsapp';
  recipientName: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  defaultSubject?: string;
  defaultMessage: string;
}

export function MessageComposerModal({
  open,
  onClose,
  channel,
  recipientName,
  recipientEmail,
  recipientPhone,
  defaultSubject,
  defaultMessage,
}: MessageComposerModalProps) {
  const [subject, setSubject] = useState(defaultSubject || '');
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [failure, setFailure] = useState<{ reason: string; suggestion?: string } | null>(null);

  useEffect(() => setMounted(true), []);

  // Reset the draft (and any prior failure) whenever a new composer is opened for a (possibly new) recipient
  useEffect(() => {
    if (open) {
      setSubject(defaultSubject || '');
      setMessage(defaultMessage);
      setFailure(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recipientName, channel]);

  if (!mounted || !open) return null;

  const isEmail = channel === 'email';
  const recipientLabel = isEmail ? recipientEmail : recipientPhone;

  async function handleSend() {
    if (!message.trim()) {
      toast.error('Please write a message before sending.');
      return;
    }
    if (isEmail && !subject.trim()) {
      toast.error('Please add a subject line.');
      return;
    }

    setSending(true);
    setFailure(null);
    try {
      const result = isEmail
        ? await sendManagementEmail({ to: recipientEmail || '', subject, message })
        : await sendManagementWhatsApp({ to: recipientPhone || '', message });

      if (result.success) {
        toast.success(isEmail ? `Email sent to ${recipientName}` : `WhatsApp message sent to ${recipientName}`);
        onClose();
      } else {
        const reason = result.error || 'Failed to send message.';
        setFailure({ reason, suggestion: result.suggestion });
        toast.error(reason);
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Failed to send message.';
      setFailure({ reason, suggestion: 'Try again in a moment. If this keeps happening, contact your admin with this error message.' });
      toast.error(reason);
    } finally {
      setSending(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !sending && onClose()} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-[1.5rem] border border-[#FF8A75]/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
              <img
                src={isEmail ? '/assets/gmail_icon.png' : '/assets/whatsapp_icon.png'}
                alt={isEmail ? 'Gmail' : 'WhatsApp'}
                className="w-7 h-7 object-contain"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold font-aktiv text-slate-900 truncate">
                {isEmail ? 'Compose Email' : 'Compose WhatsApp'}
              </h3>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 truncate">
                To {recipientName} {recipientLabel ? `· ${recipientLabel}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => !sending && onClose()}
            className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 p-5">
          <p className="text-[10px] font-bold text-slate-400 -mt-1">
            {isEmail
              ? `Sent from ${'simrat@faceyoguez.com'}`
              : 'Sent from the official Faceyoguez WhatsApp Business number'}
          </p>

          {isEmail && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setFailure(null); }}
                disabled={sending}
                placeholder="Subject line"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/10 focus:border-[#FF8A75]/30 transition-all disabled:opacity-60"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Message</label>
            <textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); setFailure(null); }}
              disabled={sending}
              rows={6}
              placeholder="Type your message..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF8A75]/10 focus:border-[#FF8A75]/30 transition-all resize-none disabled:opacity-60"
            />
          </div>

          {failure && (
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-red-600">
                    {isEmail ? 'Email' : 'WhatsApp message'} not sent
                  </p>
                  <p className="text-xs font-semibold text-red-700 mt-0.5">{failure.reason}</p>
                </div>
              </div>
              {failure.suggestion && (
                <div className="flex items-start gap-2 pt-2 border-t border-red-100/80">
                  <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-slate-700">{failure.suggestion}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending}
            className={cn(
              "mt-1 w-full h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all",
              isEmail ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700",
              sending && "opacity-70 cursor-not-allowed"
            )}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending...' : failure ? 'Retry Send' : isEmail ? 'Send Email' : 'Send WhatsApp Message'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
