'use client';

import { useState } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { ChatWindow } from '@/components/chat';
import { Loader2 } from 'lucide-react';
import type {
  Profile,
  ConversationWithDetails,
  SubscriptionPlanType,
  ConversationParticipant,
} from '@/types/database';

interface Props {
  currentUser: Profile;
  planType: SubscriptionPlanType;
}

export function StudentChatClient({ currentUser, planType }: Props) {
  const conversationType = planType === 'one_on_one' ? 'direct' : 'group';

  const { conversations, isLoading } = useConversations({
    userId: currentUser.id,
    type: conversationType,
  });

  const [selectedConv, setSelectedConv] = useState<ConversationWithDetails | null>(null);

  if (planType === 'lms') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900">Chat Not Available</h2>
          <p className="mt-2 text-gray-500">
            Your LMS plan does not include chat access.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
      </div>
    );
  }

  // 1:1 — auto-select the only conversation
  if (planType === 'one_on_one') {
    const directConv = conversations[0];

    if (!directConv) {
      return (
        <div className="flex h-[80vh] items-center justify-center">
          <p className="text-gray-500">Your instructor will connect with you shortly.</p>
        </div>
      );
    }

    const instructor = directConv.participants?.find(
      (p: ConversationParticipant & { profile: Profile }) =>
        p.profile?.role === 'instructor'
    );

    return (
      <div className="h-screen p-4">
        <ChatWindow
          conversationId={directConv.id}
          currentUser={currentUser}
          conversationType="direct"
          title={instructor?.profile?.full_name || 'Instructor'}
          otherParticipant={instructor?.profile}
          className="h-full"
        />
      </div>
    );
  }

  // Group — show list + chat
  return (
    <div className="flex h-screen">
      <div className="w-80 overflow-y-auto border-r border-pink-100/40">
        <div className="border-b border-pink-100/40 px-4 py-4">
          <h2 className="text-lg font-bold">Your Batches</h2>
        </div>
        {conversations.map((conv: ConversationWithDetails) => (
          <button
            key={conv.id}
            onClick={() => setSelectedConv(conv)}
            className={`w-full border-b border-pink-50/60 px-4 py-3 text-left transition-colors hover:bg-pink-50/40 ${
              selectedConv?.id === conv.id ? 'border-l-2 border-l-pink-500 bg-pink-50/60' : ''
            }`}
          >
            <p className="text-sm font-semibold">{conv.title || conv.batch?.name}</p>
          </button>
        ))}
      </div>
      <div className="flex-1 p-4">
        {selectedConv ? (
          <ChatWindow
            key={selectedConv.id}
            conversationId={selectedConv.id}
            currentUser={currentUser}
            conversationType="group"
            title={selectedConv.title || 'Group Chat'}
            className="h-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            Select a batch to view group chat
          </div>
        )}
      </div>
    </div>
  );
}
