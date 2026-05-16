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
  planType: SubscriptionPlanType | null;
}

export function StudentChatClient({ currentUser, planType }: Props) {
  const conversationType = planType === 'one_on_one' ? 'direct' : 'group';

  const { conversations, isLoading } = useConversations({
    userId: currentUser.id,
    type: planType ? conversationType : 'direct', // fallback; rendered state guards null
  });

  const [selectedConv, setSelectedConv] = useState<ConversationWithDetails | null>(null);

  // No plan at all — unsubscribed user
  if (!planType) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="max-w-md text-center space-y-6">
          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Chat Not Available</h2>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              You don&apos;t have an active plan yet. Subscribe to a <span className="text-[#FF8A75]">1-on-1</span> or <span className="text-[#FF8A75]">Group</span> plan to unlock chat.
            </p>
          </div>
        </div>
      </div>
    );
 }

  if (planType === 'lms') {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="max-w-md text-center space-y-6">
          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
             <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h2>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                You&apos;re on a self-paced plan. Upgrade to a <span className="text-[#FF8A75]">1-on-1 plan</span> to unlock direct chat with your instructor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8A75]" />
      </div>
    );
  }

  // 1:1 — auto-select the only conversation
  if (planType === 'one_on_one') {
    const directConv = conversations[0];

    if (!directConv) {
      return (
        <div className="flex items-center justify-center py-40">
          <div className="max-w-md text-center space-y-6">
             <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-[#FF8A75]">
                <Sparkles className="h-8 w-8 animate-pulse" />
             </div>
             <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Transmitting Connection</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Your instructor will start the conversation soon.</p>
             </div>
          </div>
        </div>
      );
    }

    const instructor = directConv.participants?.find(
      (p: ConversationParticipant & { profile: Profile }) =>
        p.profile?.role === 'instructor'
    );

    return (
      <div className="min-h-full font-jakarta p-4 sm:p-6 lg:p-8 space-y-6">
        <header className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900 tracking-tight">
                    Direct <span className="text-[#FF8A75]">Chat</span>
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-1">1-on-1 connection with your personal guide</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#FF8A75]/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#FF8A75]" />
            </div>
        </header>

        <ChatWindow
          conversationId={directConv.id}
          currentUser={currentUser}
          conversationType="direct"
          title={instructor?.profile?.full_name || 'Your Guide'}
          otherParticipant={instructor?.profile}
          className="h-[calc(100vh-14rem)] min-h-[500px] rounded-[1.75rem] border border-slate-100 shadow-sm overflow-hidden bg-white"
          isMultiParty={true}
        />
      </div>
    );
  }

  // Group — show list + chat
  return (
    <div className="min-h-full font-jakarta p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between">
          <div>
              <h1 className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900 tracking-tight">
                  Group <span className="text-[#FF8A75]">Communion</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">Shared journey with your batch companions</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#FF8A75]/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#FF8A75]" />
          </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-14rem)] min-h-[500px]">
        {/* Conversation Sidebar */}
        <div className={cn(
          "w-full lg:w-80 flex flex-col border border-slate-100 rounded-[1.75rem] bg-white shadow-sm overflow-hidden shrink-0",
          selectedConv ? "hidden lg:flex" : "flex"
        )}>
          <div className="p-6 border-b border-slate-50 space-y-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Channels</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Active Sessions</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar max-h-[300px] lg:max-h-none">
            {conversations.map((conv: ConversationWithDetails) => {
              const isActive = selectedConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={cn(
                    "w-full flex items-center justify-between gap-4 p-4 rounded-xl transition-all duration-300 text-left group",
                    isActive 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : "bg-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                  )}
                >
                  <div className="min-w-0">
                     <p className="text-sm font-bold truncate">{conv.title || conv.batch?.name || 'Group Soul'}</p>
                     <p className={cn("text-[9px] font-black uppercase tracking-widest mt-1", isActive ? "text-[#FF8A75]" : "text-slate-300")}>Live Now</p>
                  </div>
                  <ChevronRight className={cn("w-3.5 h-3.5 transition-transform group-hover:translate-x-1", isActive ? "text-white/20" : "text-slate-200")} />
                </button>
              );
            })}
            {conversations.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <Sparkles className="w-8 h-8 mb-4 text-slate-300" />
                  <p className="text-[9px] text-center font-black uppercase tracking-widest text-slate-400">No active channels</p>
               </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden",
          !selectedConv ? "hidden lg:flex" : "flex h-[500px] lg:h-full"
        )}>
          {selectedConv ? (
            <div className="flex-1 flex flex-col overflow-hidden relative">
               <button 
                  onClick={() => setSelectedConv(null)}
                  className="lg:hidden absolute top-4 left-4 z-50 h-10 px-4 rounded-xl bg-white border border-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm"
               >
                  ← Back
               </button>
               <ChatWindow
                  key={selectedConv.id}
                  conversationId={selectedConv.id}
                  currentUser={currentUser}
                  conversationType="group"
                  title={selectedConv.title || selectedConv.batch?.name || 'Group Chat'}
                  className="h-full rounded-[1.75rem] border border-slate-100 shadow-sm overflow-hidden bg-white"
               />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-50/50 rounded-[1.75rem] border border-dashed border-slate-200">
               <div className="text-center space-y-6">
                  <div className="h-16 w-16 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center mx-auto text-slate-300">
                      <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Select a channel to begin</p>
               </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
