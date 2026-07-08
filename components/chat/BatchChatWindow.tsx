'use client';

import { useRef, useEffect, useState } from 'react';
import { useBatchMessages } from '@/hooks/useBatchMessages';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Loader2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/database';

interface BatchChatWindowProps {
  batchId: string;
  currentUser: Profile;
  title: string;
  hideHeader?: boolean;
  className?: string;
  dark?: boolean;
}

/**
 * Group-session equivalent of ChatWindow, backed by useBatchMessages
 * (batch_messages table) instead of the 1-on-1 chat_messages system.
 */
export function BatchChatWindow({
  batchId,
  currentUser,
  title,
  hideHeader = false,
  className = '',
  dark = false,
}: BatchChatWindowProps) {
  const { messages, isLoading, sendMessage } = useBatchMessages({
    batchId,
    currentUserId: currentUser.id,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    if (isAtBottom && containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [lastMessageId, isAtBottom]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 100);
  };

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden relative h-full w-full',
        dark ? 'bg-[#1a1a1a] text-white border border-white/5' : 'bg-white/40 backdrop-blur-3xl border border-primary/5',
        className
      )}
    >
      {!hideHeader && (
        <div className={cn('flex items-center gap-3 border-b px-6 py-4', dark ? 'border-white/5 bg-white/[0.02]' : 'border-outline-variant/5 bg-white/20')}>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold', dark ? 'bg-white/5 text-white ring-1 ring-white/10' : 'bg-foreground text-background')}>
            {title.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className={cn('text-sm font-bold tracking-tight', dark ? 'text-white' : 'text-foreground')}>{title}</h3>
            <p className={cn('text-[10px] font-black uppercase tracking-[0.2em]', dark ? 'text-white/30' : 'text-foreground/40')}>Group Chat</p>
          </div>
        </div>
      )}

      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-6 space-y-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className={cn('flex h-full flex-col items-center justify-center gap-4', dark ? 'text-white/20' : 'text-foreground/20')}>
            <MessageCircle className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium italic">No messages yet — say hello!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const showSender =
                !prevMsg || prevMsg.sender_id !== msg.sender_id ||
                new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === currentUser.id}
                  showSender={showSender}
                  isMultiParty
                  dark={dark}
                  currentUserRole={currentUser.role}
                />
              );
            })}
            <div ref={messagesEndRef} className="h-4" />
          </>
        )}
      </div>

      <MessageInput
        onSendText={(text) => sendMessage(text)}
        onSendFile={() => alert('File sharing is not available in group chat yet.')}
        dark={dark}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(${dark ? '255,255,255' : '0,0,0'}, ${dark ? '0.1' : '0.05'}); border-radius: 20px; }
      `}</style>
    </div>
  );
}
