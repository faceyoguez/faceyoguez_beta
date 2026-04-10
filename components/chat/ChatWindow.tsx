'use client';

import { useRef, useEffect, useState } from 'react';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Loader2, MessageCircle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile, ConversationType } from '@/types/database';

interface ChatWindowProps {
  conversationId: string;
  currentUser: Profile;
  conversationType: ConversationType;
  title: string;
  otherParticipant?: Profile;
  hideHeader?: boolean;
  className?: string;
  isMultiParty?: boolean;
  dark?: boolean;
}

export function ChatWindow({
  conversationId,
  currentUser,
  conversationType,
  title,
  otherParticipant,
  hideHeader = false,
  className = '',
  isMultiParty = false,
  dark = false,
}: ChatWindowProps) {
  const {
    messages,
    isLoading,
    hasMore,
    isChatEnabled,
    sendMessage,
    sendFile,
    loadMore,
  } = useRealtimeMessages({
    conversationId,
    currentUserId: currentUser.id,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    if (isAtBottom && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [lastMessageId, isAtBottom]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 100);
    if (scrollTop === 0 && hasMore) loadMore();
  };

  const isStaff = ['admin', 'instructor', 'staff'].includes(currentUser.role);
  const canSend = conversationType === 'direct' ? true : (isChatEnabled || isStaff);

  return (
    <div className={cn(
      "flex flex-col overflow-hidden relative transition-all duration-700 shadow-2xl",
      dark 
        ? "bg-[#1a1a1a] text-white border border-white/5 shadow-slate-900/50 rounded-[2.5rem] lg:rounded-[4.5rem]" 
        : "bg-white/40 backdrop-blur-3xl border border-primary/5 shadow-primary/5 rounded-[2.5rem]",
      className
    )}>
      
      {/* Decorative Blur Backgrounds */}
      <div className={cn(
        "absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] -translate-y-24 translate-x-24 pointer-events-none opacity-50",
        dark ? "bg-primary/5" : "bg-primary/10"
      )} />
      <div className={cn(
        "absolute bottom-0 left-0 w-80 h-80 rounded-full blur-[120px] translate-y-24 -translate-x-24 pointer-events-none opacity-30",
        dark ? "bg-primary/5" : "bg-primary/5"
      )} />

      {/* Header */}
      {!hideHeader && (
        <div className={cn(
          "flex items-center justify-between border-b px-8 py-6 backdrop-blur-3xl relative z-10",
          dark ? "border-white/5 bg-white/[0.02]" : "border-outline-variant/5 bg-white/20"
        )}>
          <div className="flex items-center gap-5">
            <div className="relative group">
                <div className={cn(
                  "absolute -inset-1 rounded-[1.2rem] blur opacity-0 group-hover:opacity-100 transition duration-700",
                  dark ? "bg-primary/10" : "bg-gradient-to-tr from-primary/20 to-brand-emerald/20"
                )} />
                {otherParticipant?.avatar_url ? (
                    <div className={cn(
                      "relative h-12 w-12 rounded-[1rem] overflow-hidden p-0.5",
                      dark ? "ring-1 ring-white/10 bg-white/5" : "ring-2 ring-white border border-primary/20 bg-white"
                    )}>
                        <img
                        src={otherParticipant.avatar_url}
                        alt={otherParticipant.full_name}
                        className="h-full w-full rounded-[0.8rem] object-cover"
                        />
                    </div>
                ) : (
                    <div className={cn(
                      "relative flex h-12 w-12 items-center justify-center rounded-[1rem] text-lg font-serif font-bold shadow-sm",
                      dark ? "bg-white/5 text-white ring-1 ring-white/10" : "bg-foreground text-background"
                    )}>
                    {title.charAt(0).toUpperCase()}
                    </div>
                )}
                {/* Online status indicator */}
                <div className={cn(
                  "absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2",
                  dark ? "bg-emerald-500 border-[#0a0a0a]" : "bg-primary border-white"
                )} />
            </div>
            <div className="space-y-0.5">
                <h3 className={cn("text-base font-bold tracking-tight capitalize", dark ? "text-white" : "text-foreground")}>{title}</h3>
                <div className="flex items-center gap-2">
                    <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", dark ? "text-white/30" : "text-foreground/40")}>
                        {conversationType === 'group' ? 'Group Class Channel' : 'Direct Communion'}
                    </p>
                    {!isChatEnabled && conversationType === 'group' && (
                        <span className="rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border border-amber-500/20">
                            Flow Paused
                        </span>
                    )}
                </div>
            </div>
          </div>
          
          <button className={cn(
            "h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-300",
            dark ? "hover:bg-white/5 text-white/20 hover:text-white" : "hover:bg-foreground/5 text-foreground/20 hover:text-foreground"
          )}>
             <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-8 py-8 space-y-4 custom-scrollbar relative z-10"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center animate-pulse",
                  dark ? "bg-white/5" : "bg-primary/5"
                )}>
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
                <p className={cn("text-[10px] font-black uppercase tracking-widest", dark ? "text-white/20" : "text-foreground/20")}>Synchronizing Flow</p>
            </div>
          </div>
        ) : (
          <>
            {hasMore && (
              <button
                onClick={loadMore}
                className={cn(
                  "mb-10 w-full text-center text-[10px] font-black uppercase tracking-widest transition-all py-3 rounded-2xl border active:scale-95",
                  dark 
                    ? "text-white/40 hover:text-white bg-white/5 border-white/5 hover:bg-white/10" 
                    : "text-primary/40 hover:text-primary bg-primary/5 border-primary/10 hover:bg-primary/10"
                )}
              >
                Recall Past Reflections
              </button>
            )}

            {messages.length === 0 && (
              <div className={cn("flex h-full flex-col items-center justify-center space-y-6", dark ? "text-white/20" : "text-foreground/20")}>
                <div className={cn(
                  "h-20 w-20 rounded-[2.5rem] flex items-center justify-center relative",
                  dark ? "bg-white/5 ring-1 ring-white/10" : "bg-surface-container-low"
                )}>
                    <MessageCircle className="w-10 h-10 opacity-30" />
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full animate-ping opacity-20" />
                </div>
                <p className="text-sm font-medium italic max-w-[200px] text-center leading-relaxed">Begin your private transformation story here...</p>
              </div>
            )}

            <div className="space-y-1">
              {messages.map((msg, idx) => {
                const prevMsg = messages[idx - 1];
                const showSender =
                  !prevMsg ||
                  prevMsg.sender_id !== msg.sender_id ||
                  new Date(msg.created_at).getTime() -
                  new Date(prevMsg.created_at).getTime() >
                  5 * 60 * 1000;

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender_id === currentUser.id}
                    showSender={showSender && (conversationType === 'group' || isMultiParty)}
                    isMultiParty={isMultiParty}
                    dark={dark}
                  />
                );
              })}
            </div>
            <div ref={messagesEndRef} className="h-4" />
          </>
        )}
      </div>

      {/* Paused notice — only for group chats */}
      {!canSend && conversationType === 'group' && (
        <div className={cn(
          "px-8 py-4 text-center border-t backdrop-blur-xl",
          dark ? "bg-amber-900/10 border-amber-500/5 text-amber-500/60" : "bg-amber-50/50 border-amber-200/20 text-amber-700/60"
        )}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
            Interaction restricted by the Lead Instructor
          </p>
        </div>
      )}

      {/* Input */}
      {canSend && (
        <MessageInput
          onSendText={(text: string) => sendMessage(text)}
          onSendFile={(file: File, type: 'image' | 'pdf' | 'file') => sendFile(file, type)}
          dark={dark}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(${dark ? '255,255,255' : '0,0,0'}, ${dark ? '0.1' : '0.05'});
            border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(${dark ? '255,255,255' : '0,0,0'}, ${dark ? '0.2' : '0.1'});
        }
      `}</style>
    </div>
  );
}
