'use client';

import type { ChatMessageWithSender } from '@/types/database';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessageWithSender;
  isOwn: boolean;
  showSender?: boolean;
}

export function MessageBubble({ message, isOwn, showSender = false }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showSender ? 'mt-4' : 'mt-0.5'}`}>
      <div className="max-w-[78%]">
        {/* Sender label for group chats */}
        {showSender && !isOwn && message.sender && (
          <div className="mb-1 ml-1 flex items-center gap-2">
            {message.sender.avatar_url ? (
              <img
                src={message.sender.avatar_url}
                alt=""
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-400 text-[10px] font-bold text-white">
                {message.sender.full_name?.charAt(0)}
              </div>
            )}
            <span className="text-xs font-medium text-gray-500">
              {message.sender.full_name}
              {message.sender.role === 'instructor' && (
                <span className="ml-1.5 rounded-md bg-pink-100 px-1.5 py-0.5 text-[9px] font-bold text-pink-600">
                  Instructor
                </span>
              )}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 ${isOwn
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
                className={`flex items-center gap-2 text-sm font-medium ${isOwn ? 'text-pink-100 hover:text-white' : 'text-pink-600 hover:text-pink-700'
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
