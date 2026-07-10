'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, AlertCircle, X, MessageCircle } from 'lucide-react';
import { getZoomJoinContext } from '@/lib/actions/zoomJoin';
import { cn } from '@/lib/utils';

interface ZoomMeetingEmbedProps {
  meetingId: string;
  type: 'meeting' | 'consultation';
  onClose: () => void;
  /**
   * The app's own chat UI for this session (e.g. <OneOnOneChat .../>,
   * <ChatWindow .../>, or <BatchChatWindow .../>), rendered in a toggleable
   * panel next to the video. Zoom's own in-call chat button can't be hidden
   * (no API for it in the Component View SDK) — this is the real chat.
   */
  chatPanel?: ReactNode;
}

/**
 * Joins a Zoom meeting entirely inside the page — no Zoom login, no app switch.
 * Runs the Meeting SDK inside a same-origin iframe (public/zoom-embed.html) with its
 * own isolated React 18, because Zoom's SDK crashes under React 19 (confirmed bug on
 * Zoom's developer forum, unresolved) if loaded directly into this app's React tree.
 *
 * Renders through a portal straight to document.body — mounting this inline inside a
 * page's own layout puts it under whichever ancestor has a Framer Motion `transform`
 * (used throughout the dashboard), which silently turns `position: fixed` into
 * "fixed to that ancestor" instead of the real viewport, trapping it behind the sidebar.
 */
export function ZoomMeetingEmbed({ meetingId, type, onClose, chatPanel }: ZoomMeetingEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    let joinSent = false;

    async function sendJoin() {
      if (joinSent || cancelled) return;
      const { ctx, error } = await getZoomJoinContext({ meetingId, type });
      if (cancelled) return;
      if (error || !ctx) {
        setErrorMsg(error || 'Could not connect to the meeting.');
        setStatus('error');
        return;
      }
      if (!iframeRef.current?.contentWindow) return;
      joinSent = true;
      iframeRef.current.contentWindow.postMessage(
        { source: 'zoom-embed-host', type: 'join', payload: ctx },
        window.location.origin
      );
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.source !== 'zoom-embed') return;

      if (event.data.type === 'ready') {
        sendJoin();
      } else if (event.data.type === 'joined') {
        if (!cancelled) setStatus('ready');
      } else if (event.data.type === 'error') {
        const detail = event.data.detail || {};
        console.error('Zoom embed failed to join: ' + JSON.stringify(detail));
        if (!cancelled) {
          const parts = [detail.reason || detail.message, detail.errorCode, detail.type ? `(${detail.type})` : null].filter(Boolean);
          setErrorMsg(parts.length ? parts.join(' ') : 'Could not connect to the meeting.');
          setStatus('error');
        }
      } else if (event.data.type === 'left') {
        // Sessions are only marked Done via the explicit Done button — leaving
        // the call (host or student) just closes this window.
        if (!cancelled) onClose();
      }
    }

    window.addEventListener('message', onMessage);

    return () => {
      cancelled = true;
      window.removeEventListener('message', onMessage);
      iframeRef.current?.contentWindow?.postMessage(
        { source: 'zoom-embed-host', type: 'leave' },
        window.location.origin
      );
    };
  }, [meetingId, type]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] bg-slate-950 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4 shrink-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Live Session</p>
        <div className="flex items-center gap-2">
          {chatPanel && (
            <button
              onClick={() => setShowChat((v) => !v)}
              className={cn(
                'h-9 px-3.5 rounded-full flex items-center gap-2 text-[11px] font-bold transition-all',
                showChat ? 'bg-white text-slate-950' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              )}
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
          )}
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="relative flex-1 min-h-0 px-4 pb-4 lg:px-6 lg:pb-6 flex gap-3 overflow-hidden">
        <div className="relative flex-1 min-w-0 h-full min-h-0 rounded-2xl overflow-hidden bg-slate-950">
          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60 pointer-events-none z-10">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Connecting…</p>
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70 px-6 text-center z-10">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="text-[11px] font-semibold">{errorMsg}</p>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src="/zoom-embed.html"
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full border-0"
            title="Live Session"
          />
        </div>
        {showChat && chatPanel && (
          // Mobile: full-screen drawer below the header (so the Chat toggle stays
          // reachable to close it again). Desktop: fixed-width side panel next to video.
          <div className="fixed inset-x-0 bottom-0 top-16 z-20 lg:static lg:inset-auto lg:top-auto lg:z-auto lg:w-[380px] shrink-0 rounded-none lg:rounded-2xl overflow-hidden">
            {chatPanel}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
