'use client';

import { useRef, useEffect, useState } from 'react';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Loader2, MessageCircle, MoreHorizontal } from 'lucide-react';
import type { Profile, ConversationType } from '@/types/database';

interface ChatWindowProps {
  conversationId: string;
  currentUser: Profile;
  conversationType: ConversationType;
  title: string;
  otherParticipant?: Profile;
  /** Hide the header — useful when embedding inside another panel */
  hideHeader?: boolean;
  /** Optional class for the outermost wrapper */
  className?: string;
  /**
   * When true, render in group-chat style: show sender name + role badge on
   * every message (own and others) even for 'direct' type conversations.
   * Use this whenever 3+ parties share one conversation thread.
   */
  isMultiParty?: boolean;
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
    <div className={`flex flex-col overflow-hidden rounded-[2.5rem] bg-white/40 backdrop-blur-3xl border border-primary/5 shadow-2xl relative ${className}`}>
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-12 translate-x-12 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] translate-y-12 -translate-x-12 pointer-events-none" />

      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-outline-variant/5 px-8 py-6 backdrop-blur-xl relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-brand-emerald/20 rounded-[1.2rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                {otherParticipant?.avatar_url ? (
                    <div className="relative h-12 w-12 rounded-[1rem] overflow-hidden ring-2 ring-white shadow-xl border border-primary/20 p-0.5 bg-white">
                        <img
                        src={otherParticipant.avatar_url}
                        alt={otherParticipant.full_name}
                        className="h-full w-full rounded-[0.8rem] object-cover"
                        />
                    </div>
                ) : (
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-[1rem] bg-foreground text-background text-lg font-serif font-bold shadow-xl">
                    {title.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-primary border-4 border-white shadow-sm" />
            </div>
            <div className="space-y-0.5">
                <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
                <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
                        {conversationType === 'group' ? 'Group Chat' : 'Direct Message'}
                    </p>
                    {!isChatEnabled && conversationType === 'group' && (
                        <span className="rounded-full bg-amber-100/50 text-amber-700 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                            Paused
                        </span>
                    )}
                </div>
            </div>
          </div>
          
          <button className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-foreground/5 transition-colors text-foreground/20 hover:text-foreground">
             <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-8 py-8 space-y-2 custom-scrollbar relative z-10"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">Opening Channel</p>
            </div>
          </div>
        ) : (
          <>
            {hasMore && (
              <button
                onClick={loadMore}
                className="mb-8 w-full text-center text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors py-2 rounded-xl bg-primary/5 border border-primary/10"
              >
                Recall Past Reflections
              </button>
            )}

            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-foreground/20 space-y-4">
                <div className="h-16 w-16 rounded-[2rem] bg-surface-container-low flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm font-medium italic">Begin your transformation story here...</p>
              </div>
            )}

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
                />
              );
            })}
            <div ref={messagesEndRef} className="h-4" />
          </>
        )}
      </div>

      {/* Paused notice — only for group chats */}
      {!canSend && conversationType === 'group' && (
        <div className="bg-amber-50/50 backdrop-blur-md px-8 py-4 text-center border-t border-amber-200/20">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700/60">
            Flow is currently restricted by Instructor
          </p>
        </div>
      )}

      {/* Input */}
      {canSend && (
        <MessageInput
          onSendText={(text: string) => sendMessage(text)}
          onSendFile={(file: File, type: 'image' | 'pdf' | 'file') => sendFile(file, type)}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.05);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
