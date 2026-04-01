'use client';

import { useState } from 'react';
import { ChatSidebar, ChatWindow } from '@/components/chat';
import type { ConversationWithDetails, Profile } from '@/types/database';

interface Props {
  currentUser: Profile;
}

export function InstructorChatClient({ currentUser }: Props) {
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithDetails | null>(null);

  const getOtherParticipant = (conv: ConversationWithDetails) => {
    const other = conv.participants?.find((p) => p.user_id !== currentUser.id);
    return other?.profile;
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-background/50 backdrop-blur-xl rounded-3xl border border-outline-variant/10 overflow-hidden shadow-sm animate-in fade-in duration-700">
      <ChatSidebar
        currentUser={currentUser}
        type="direct"
        selectedConversationId={selectedConversation?.id}
        onSelectConversation={setSelectedConversation}
      />

      <div className="flex-1 p-6 lg:p-12 relative">
        {selectedConversation ? (
          <ChatWindow
            key={selectedConversation.id}
            conversationId={selectedConversation.id}
            currentUser={currentUser}
            conversationType="direct"
            title={getOtherParticipant(selectedConversation)?.full_name || 'Unknown'}
            otherParticipant={getOtherParticipant(selectedConversation)}
            className="h-full"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-surface-container flex items-center justify-center text-foreground/10 border border-outline-variant/5 shadow-inner">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
            </div>
            <div className="space-y-2">
                <p className="text-xl font-serif font-bold text-foreground tracking-tight">Focus on Presence</p>
                <p className="text-sm font-bold text-foreground/20 uppercase tracking-widest leading-relaxed">Select a conversation to begin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
