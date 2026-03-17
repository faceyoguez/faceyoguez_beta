'use client';

import type { ChatMessageWithSender } from '@/types/database';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessageWithSender;
  isOwn: boolean;
  /** Show sender name/role above the bubble (group-chat style) */
  showSender?: boolean;
  /** When true, show sender even for your own messages */
  isMultiParty?: boolean;
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  instructor: { label: 'Instructor', className: 'bg-pink-100 text-pink-600' },
  admin: { label: 'Admin', className: 'bg-purple-100 text-purple-600' },
  staff: { label: 'Staff', className: 'bg-blue-100 text-blue-600' },
  client_management: { label: 'Staff', className: 'bg-blue-100 text-blue-600' },
  student: { label: 'Student', className: 'bg-emerald-100 text-emerald-600' },
};

export function MessageBubble({ message, isOwn, showSender = false, isMultiParty = false }: MessageBubbleProps) {
  const shouldShowSender = showSender && (isMultiParty || !isOwn);
  const badge = message.sender?.role ? ROLE_BADGE[message.sender.role] : null;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${shouldShowSender ? 'mt-4' : 'mt-0.5'}`}>
      <div className={`max-w-[78%] ${isOwn ? 'items-end flex flex-col' : ''}`}>

        {/* Sender label */}
        {shouldShowSender && message.sender && (
          <div className={`mb-1 flex items-center gap-2 ${isOwn ? 'flex-row-reverse mr-1' : 'ml-1'}`}>
            {message.sender.avatar_url ? (
              <img
                src={message.sender.avatar_url}
                alt=""
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-400 text-[10px] font-bold text-white">
                {message.sender.full_name?.charAt(0)}
              </div>
            )}
            <span className={`text-xs font-semibold ${isOwn ? 'text-gray-500' : 'text-gray-600'}`}>
              {isOwn ? 'You' : message.sender.full_name}
            </span>
            {badge && (
              <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${badge.className}`}>
                {badge.label}
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'rounded-br-md bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-200/30'
              : 'rounded-bl-md bg-white/80 text-gray-800 shadow-sm ring-1 ring-pink-100/40'
          }`}
        >
          {message.content_type === 'text' && (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.content}
            </p>
          )}

          {message.content_type === 'image' && message.file_url && (
            <img
              src={message.file_url}
              alt={'Image'}
              className="max-h-64 max-w-full cursor-pointer rounded-lg object-cover"
              onClick={() => window.open(message.file_url!, '_blank')}
            />
          )}

          {(message.content_type === 'pdf' || message.content_type === 'file') &&
            message.file_url && (
              <a
                href={message.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm font-medium ${
                  isOwn ? 'text-pink-100 hover:text-white' : 'text-pink-600 hover:text-pink-700'
                }`}
              >
                📄 Download file
              </a>
            )}
        </div>

        {/* Timestamp */}
        <p className={`mt-1 text-[10px] font-medium text-gray-400 ${isOwn ? 'mr-1 text-right' : 'ml-1'}`}>
          {format(new Date(message.created_at), 'h:mm a')}
        </p>
      </div>
    </div>
  );
}
