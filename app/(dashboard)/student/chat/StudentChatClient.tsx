'use client';

import { useState } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { ChatWindow } from '@/components/chat';
import { Loader2, MessageSquare, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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
      <div className="flex h-[80vh] items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="h-16 w-16 bg-foreground/5 rounded-2xl flex items-center justify-center mx-auto text-foreground/20">
             <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Sanctuary of Silence</h2>
          <p className="text-sm text-foreground/40 font-medium italic">
            Your current path is one of self-study. Transition to a Mentorship plan to enable direct communion.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  // 1:1 — auto-select the only conversation
  if (planType === 'one_on_one') {
    const directConv = conversations[0];

    if (!directConv) {
      return (
        <div className="flex h-[80vh] items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
             <Sparkles className="h-10 w-10 text-primary/20 mx-auto animate-pulse" />
             <h2 className="text-xl font-serif font-bold text-foreground">Transmitting Connection</h2>
             <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest italic">Your guide will initiate the frequency shortly.</p>
          </div>
        </div>
      );
    }

    const instructor = directConv.participants?.find(
      (p: ConversationParticipant & { profile: Profile }) =>
        p.profile?.role === 'instructor'
    );

    return (
      <div className="h-screen bg-background p-4 lg:p-8 animate-in fade-in duration-1000">
        <ChatWindow
          conversationId={directConv.id}
          currentUser={currentUser}
          conversationType="direct"
          title={instructor?.profile?.full_name || 'Your Guide'}
          otherParticipant={instructor?.profile}
          className="h-full rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl"
          isMultiParty={true}
        />
      </div>
    );
  }

  // Group — show list + chat
  return (
    <div className="flex h-screen bg-background overflow-hidden animate-in fade-in duration-1000">
      
      {/* Conversation Sidebar */}
      <div className="w-80 flex flex-col border-r border-outline-variant/5 bg-white/50 backdrop-blur-2xl">
        <div className="p-8 border-b border-outline-variant/5 space-y-1">
          <h2 className="text-xl font-serif font-bold text-foreground">Communion</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 italic">Active Batches</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {conversations.map((conv: ConversationWithDetails) => {
            const isActive = selectedConv?.id === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={cn(
                  "w-full flex items-center justify-between gap-4 p-4 rounded-2xl transition-all duration-500 text-left group",
                  isActive 
                    ? "bg-foreground text-background shadow-md scale-[1.01]" 
                    : "bg-transparent hover:bg-foreground/5 text-foreground/60 hover:text-foreground"
                )}
              >
                <div className="min-w-0">
                   <p className="text-sm font-bold truncate">{conv.title || conv.batch?.name || 'Group Soul'}</p>
                   <p className={cn("text-[9px] font-bold uppercase tracking-widest italic mt-1", isActive ? "text-background/40" : "text-foreground/20")}>Frequency Stream</p>
                </div>
                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform group-hover:translate-x-1", isActive ? "text-background/20" : "text-foreground/10")} />
              </button>
            );
          })}
          {conversations.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <Sparkles className="w-8 h-8 mb-4" />
                <p className="text-[10px] text-center font-bold uppercase tracking-widest italic">No active group streams</p>
             </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col p-4 lg:p-8 bg-surface-container/5">
        {selectedConv ? (
          <ChatWindow
            key={selectedConv.id}
            conversationId={selectedConv.id}
            currentUser={currentUser}
            conversationType="group"
            title={selectedConv.title || selectedConv.batch?.name || 'Collective Resonance'}
            className="h-full rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
             <div className="text-center space-y-6 opacity-10">
                <div className="h-20 w-20 rounded-full border border-dashed border-foreground/20 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-8 h-8" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest">Select a resonance to begin</p>
             </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
