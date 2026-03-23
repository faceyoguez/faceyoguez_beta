'use client';

import { useState } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { searchStudents, getOrCreateDirectChat } from '@/lib/actions/chat';
import { formatDistanceToNow } from 'date-fns';
import { Search, Loader2 } from 'lucide-react';
import type {
  ConversationWithDetails,
  Profile,
  ConversationType,
  ConversationParticipant,
} from '@/types/database';

interface ChatSidebarProps {
  currentUser: Profile;
  type: ConversationType;
  selectedConversationId?: string;
  onSelectConversation: (conv: ConversationWithDetails) => void;
}

export function ChatSidebar({
  currentUser,
  type,
  selectedConversationId,
  onSelectConversation,
}: ChatSidebarProps) {
  const { conversations, isLoading } = useConversations({
    userId: currentUser.id,
    type,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
      subscriptions?: Array<{ plan_type: string; status: string }>;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const isStaff = ['admin', 'instructor', 'staff'].includes(currentUser.role);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchStudents(query);
      setSearchResults(results || []);
    } catch (e) {
      console.error('Search error:', e);
    }
    setIsSearching(false);
  };

  const handleStartChat = async (studentId: string) => {
    try {
      const { conversationId } = await getOrCreateDirectChat(studentId);
      setSearchQuery('');
      setSearchResults([]);
      window.location.href = `/instructor/chat?id=${conversationId}`;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'An error occurred';
      alert(message);
    }
  };

  const getTitle = (conv: ConversationWithDetails) => {
    if (conv.type === 'group') return conv.title || conv.batch?.name || 'Group';
    const other = conv.participants?.find(
      (p: ConversationParticipant & { profile: Profile }) =>
        p.user_id !== currentUser.id
    );
    return other?.profile?.full_name || 'Unknown';
  };

  const getAvatar = (conv: ConversationWithDetails) => {
    if (conv.type === 'group') return null;
    const other = conv.participants?.find(
      (p: ConversationParticipant & { profile: Profile }) =>
        p.user_id !== currentUser.id
    );
    return other?.profile?.avatar_url || null;
  };

  return (
    <div className="flex h-full w-80 flex-col border-r border-primary/5 bg-white/60 backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-primary/5 px-4 py-4">
        <h2 className="text-base font-bold text-foreground">
          {type === 'direct' ? 'Direct Messages' : 'Group Chats'}
        </h2>

        {isStaff && type === 'direct' && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full rounded-xl border border-primary/10 bg-white/50 py-2 pl-9 pr-4 text-sm outline-none transition-all focus:ring-4 focus:ring-primary/5 focus:border-primary/20"
            />

            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-pink-100 bg-white shadow-xl">
                {searchResults.map((student) => {
                  const hasOneOnOne = student.subscriptions?.some(
                    (s) => s.plan_type === 'one_on_one' && s.status === 'active'
                  );
                  return (
                    <button
                      key={student.id}
                      onClick={() => handleStartChat(student.id)}
                      disabled={!hasOneOnOne}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-lg">
                        {student.full_name?.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {student.full_name}
                        </p>
                        <p className="truncate text-xs text-gray-500">{student.email}</p>
                      </div>
                      {!hasOneOnOne && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                          No 1:1
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No conversations yet</div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className={`flex w-full items-center gap-3 border-b border-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/5 ${
                selectedConversationId === conv.id
                  ? 'border-l-2 border-l-primary bg-primary/5'
                  : ''
              }`}
            >
              {getAvatar(conv) ? (
                <img src={getAvatar(conv)!} alt="" className="h-10 w-10 rounded-full object-cover shadow-sm ring-1 ring-primary/10" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-md">
                  {getTitle(conv).charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-semibold text-gray-800">{getTitle(conv)}</p>
                  {conv.last_message && (
                    <span className="flex-shrink-0 text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(conv.last_message.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs text-gray-500">
                    {conv.last_message?.content || 'No messages yet'}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="ml-2 min-w-[18px] flex-shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-bold text-white shadow-sm ring-1 ring-primary/20">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
