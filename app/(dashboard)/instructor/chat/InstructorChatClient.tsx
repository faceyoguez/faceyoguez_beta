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
    <div className="flex h-screen">
      <ChatSidebar
        currentUser={currentUser}
        type="direct"
        selectedConversationId={selectedConversation?.id}
        onSelectConversation={setSelectedConversation}
      />

      <div className="flex-1 p-4">
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
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <svg className="mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="mt-1 text-sm">Search for a student or pick from the list</p>
          </div>
        )}
      </div>
    </div>
  );
}
