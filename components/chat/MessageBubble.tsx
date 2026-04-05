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
  instructor: { label: 'Instructor', className: 'bg-primary/10 text-primary' },
  admin: { label: 'Admin', className: 'bg-primary/10 text-primary' },
  staff: { label: 'Staff', className: 'bg-primary/10 text-primary' },
  client_management: { label: 'Staff', className: 'bg-primary/10 text-primary' },
  student: { label: 'Student', className: 'bg-foreground/5 text-foreground/40' },
};

export function MessageBubble({ message, isOwn, showSender = false, isMultiParty = false }: MessageBubbleProps) {
  const shouldShowSender = showSender && (isMultiParty || !isOwn);
  const badge = message.sender?.role ? ROLE_BADGE[message.sender.role] : null;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${shouldShowSender ? 'mt-6' : 'mt-1'}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] ${isOwn ? 'items-end flex flex-col' : ''}`}>

        {/* Sender label */}
        {shouldShowSender && message.sender && (
          <div className={`mb-2 flex items-center gap-2.5 ${isOwn ? 'flex-row-reverse mr-2' : 'ml-2'}`}>
            <div className="h-6 w-6 rounded-full overflow-hidden ring-2 ring-white lustre-border p-0.5">
              {message.sender.avatar_url ? (
                <img
                  src={message.sender.avatar_url}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-sand/30 text-[10px] font-black text-foreground/40">
                  {message.sender.full_name?.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 capitalize">
              {isOwn ? 'You' : message.sender.full_name}
            </span>
            {badge && (
              <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${badge.className}`}>
                {badge.label}
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`px-5 py-3.5 transition-all duration-300 ${
            isOwn
              ? 'rounded-[1.5rem] rounded-tr-[0.4rem] bg-foreground text-background'
              : 'bg-white/60 backdrop-blur-xl rounded-[1.5rem] rounded-tl-[0.4rem] text-foreground border border-primary/5'
          }`}
        >
          {message.content_type === 'text' && (
            <p className="whitespace-pre-wrap break-words text-[13px] sm:text-sm font-medium leading-[1.6]">
              {message.content}
            </p>
          )}

          {message.content_type === 'image' && message.file_url && (
            <div className="relative group overflow-hidden rounded-xl bg-surface-container-low">
                <img
                src={message.file_url}
                alt={'Image'}
                className="max-h-80 max-w-full cursor-pointer object-cover group-hover:scale-[1.02] transition-transform duration-500"
                onClick={() => window.open(message.file_url!, '_blank')}
                />
            </div>
          )}

          {(message.content_type === 'pdf' || message.content_type === 'file') &&
            message.file_url && (
              <a
                href={message.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all ${
                  isOwn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-foreground/5 text-foreground hover:bg-foreground/10'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isOwn ? 'bg-white/20' : 'bg-foreground/10'}`}>
                    <span className="text-[10px] font-black">PDF</span>
                </div>
                <span className="text-xs font-bold truncate max-w-[150px]">Manifest File</span>
              </a>
            )}
        </div>

        {/* Timestamp */}
        <p className={`mt-1.5 text-[9px] font-black uppercase tracking-widest text-foreground/20 ${isOwn ? 'mr-2 text-right' : 'ml-2'}`}>
          {format(new Date(message.created_at), 'h:mm a')}
        </p>
      </div>
    </div>
  );
}
