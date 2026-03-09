'use client';

import { useRef, useEffect, useState } from 'react';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Loader2 } from 'lucide-react';
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
}

export function ChatWindow({
  conversationId,
  currentUser,
  conversationType,
  title,
  otherParticipant,
  hideHeader = false,
  className = '',
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
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
  // Students can always send messages (stored in DB for when instructor is online)
  // Chat enabled toggle only restricts group chats
  const canSend = conversationType === 'direct' ? true : (isChatEnabled || isStaff);

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl ring-1 ring-pink-100/40 ${className}`}>
      {/* DEBUG: Remove after confirming chat works */}
      <div className="bg-yellow-100 px-3 py-1 text-[10px] font-mono text-yellow-800">
        conv: {conversationId.slice(0, 8)}… | msgs: {messages.length} | user: {currentUser.id.slice(0, 8)}…
      </div>
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center gap-3 border-b border-pink-100/40 bg-white/30 px-5 py-3 backdrop-blur-md">
          {otherParticipant?.avatar_url ? (
            <img
              src={otherParticipant.avatar_url}
              alt={otherParticipant.full_name}
              className="h-10 w-10 rounded-xl border-2 border-white object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-sm font-bold text-white shadow-sm">
              {title.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-gray-800">{title}</h3>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                {conversationType === 'group' ? 'Group Chat' : 'Direct Message'}
              </p>
              {!isChatEnabled && conversationType === 'group' && (
                <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                  Paused
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-gradient-to-b from-white/20 to-transparent px-5 py-4"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
          </div>
        ) : (
          <>
            {hasMore && (
              <button
                onClick={loadMore}
                className="mb-3 w-full text-center text-xs font-medium text-pink-500 transition-colors hover:text-pink-600"
              >
                Load older messages
              </button>
            )}

            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-gray-400">
                <p className="text-sm">No messages yet. Start the conversation!</p>
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
                  showSender={showSender && conversationType === 'group'}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Paused notice — only for group chats */}
      {!canSend && conversationType === 'group' && (
        <div className="border-t border-amber-200 bg-amber-50 px-5 py-3 text-center">
          <p className="text-sm font-medium text-amber-700">
            Chat is currently paused by the instructor
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
    </div>
  );
}
