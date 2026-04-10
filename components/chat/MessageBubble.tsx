'use client';

import { cn } from '@/lib/utils';
import type { ChatMessageWithSender, Profile } from '@/types/database';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessageWithSender;
  isOwn: boolean;
  /** Show sender name/role above the bubble (group-chat style) */
  showSender?: boolean;
  /** When true, show sender even for your own messages */
  isMultiParty?: boolean;
  dark?: boolean;
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  instructor: { label: 'Instructor', className: 'bg-primary/10 text-primary' },
  admin: { label: 'Admin', className: 'bg-primary/10 text-primary' },
  staff: { label: 'Staff', className: 'bg-primary/10 text-primary' },
  client_management: { label: 'Staff', className: 'bg-primary/10 text-primary' },
  student: { label: 'Student', className: 'bg-foreground/5 text-foreground/40' },
};

export function MessageBubble({ message, isOwn, showSender = false, isMultiParty = false, dark = false }: MessageBubbleProps) {
  const shouldShowSender = showSender && (isMultiParty || !isOwn);
  const badge = message.sender?.role ? ROLE_BADGE[message.sender.role] : null;

  return (
    <div className={cn(
        "flex w-full group transition-all duration-300",
        isOwn ? 'justify-end' : 'justify-start',
        shouldShowSender ? 'mt-8' : 'mt-1'
    )}>
      <div className={cn(
          "max-w-[85%] sm:max-w-[75%] flex flex-col",
          isOwn ? 'items-end' : 'items-start'
      )}>

        {/* Sender label */}
        {shouldShowSender && message.sender && (
          <div className={cn(
              "mb-2.5 flex items-center gap-3",
              isOwn ? 'flex-row-reverse mr-1' : 'ml-1'
          )}>
            <div className={cn(
                "h-7 w-7 rounded-full overflow-hidden p-0.5",
                dark ? "ring-1 ring-white/10 bg-white/5" : "ring-2 ring-white lustre-border bg-white"
            )}>
              {message.sender.avatar_url ? (
                <img
                  src={message.sender.avatar_url}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className={cn(
                    "flex h-full w-full items-center justify-center rounded-full text-[10px] font-black",
                    dark ? "bg-white/5 text-white/40" : "bg-brand-sand/30 text-foreground/40"
                )}>
                  {message.sender.full_name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex flex-col">
                <span className={cn(
                "text-[10px] font-black uppercase tracking-widest leading-none mb-1",
                dark ? "text-white/40" : "text-foreground/40"
                )}>
                {isOwn ? 'You' : message.sender.full_name}
                </span>
                {badge && (
                <span className={cn(
                    "rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-widest w-fit",
                    dark ? "bg-white/5 text-white/40 border border-white/5" : badge.className
                )}>
                    {badge.label}
                </span>
                )}
            </div>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "px-6 py-4.5 transition-all duration-500 shadow-sm",
            isOwn
              ? dark 
                ? "rounded-[2.5rem] rounded-tr-none bg-[#FF8A75] text-white font-medium shadow-[#FF8A75]/10"
                : "rounded-[2.5rem] rounded-tr-[0.4rem] bg-foreground text-background font-medium"
              : dark
                ? "bg-white/5 backdrop-blur-3xl rounded-[2.5rem] rounded-tl-none text-white/90 border border-white/5"
                : "bg-white/60 backdrop-blur-xl rounded-[2.5rem] rounded-tl-[0.4rem] text-foreground border border-primary/5"
          )}
        >
          {message.content_type === 'text' && (
            <p className="whitespace-pre-wrap break-words text-[13.5px] sm:text-sm leading-[1.6] tracking-tight">
              {message.content}
            </p>
          )}

          {message.content_type === 'image' && message.file_url && (
            <div className="relative group overflow-hidden rounded-2xl bg-black/5 mt-1">
                <img
                src={message.file_url}
                alt={'Shared Image'}
                className="max-h-[32rem] max-w-full cursor-zoom-in object-cover transition-all duration-700 active:scale-[0.98]"
                onClick={() => window.open(message.file_url!, '_blank')}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          )}

          {(message.content_type === 'pdf' || message.content_type === 'file') &&
            message.file_url && (
              <a
                href={message.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-4 py-3 px-4 rounded-[1.2rem] transition-all duration-300 mt-1",
                  isOwn 
                    ? dark ? "bg-black/5 text-black hover:bg-black/10" : "bg-white/10 text-white hover:bg-white/20" 
                    : dark ? "bg-white/5 text-white hover:bg-white/10" : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  isOwn ? dark ? "bg-black/10" : "bg-white/20" : dark ? "bg-black/20" : "bg-foreground/10"
                )}>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-50">PDF</div>
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate">Study Material</span>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-0.5">Click to Open</span>
                </div>
              </a>
            )}
        </div>

        {/* Timestamp */}
        <p className={cn(
          "mt-2 text-[9px] font-black uppercase tracking-[0.2em] transition-opacity duration-300",
          isOwn ? 'mr-3 text-right' : 'ml-3',
          dark ? "text-white/20 group-hover:text-white/40" : "text-foreground/20 group-hover:text-foreground/40"
        )}>
          {format(new Date(message.created_at), 'h:mm a')}
        </p>
      </div>
    </div>
  );
}
