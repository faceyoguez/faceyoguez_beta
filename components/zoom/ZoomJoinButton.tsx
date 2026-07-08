'use client';

import { useState, type ReactNode } from 'react';
import { ZoomMeetingEmbed } from './ZoomMeetingEmbed';

interface ZoomJoinButtonProps {
  meetingId: string;
  type: 'meeting' | 'consultation';
  className?: string;
  disabled?: boolean;
  title?: string;
  children: ReactNode;
  chatPanel?: ReactNode;
}

/**
 * Drop-in "Join" trigger for server components — opens the embedded Zoom call
 * without needing to lift call state into the parent page.
 */
export function ZoomJoinButton({ meetingId, type, className, disabled, title, children, chatPanel }: ZoomJoinButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" disabled={disabled} title={title} onClick={() => setIsOpen(true)} className={className}>
        {children}
      </button>
      {isOpen && (
        <ZoomMeetingEmbed meetingId={meetingId} type={type} onClose={() => setIsOpen(false)} chatPanel={chatPanel} />
      )}
    </>
  );
}
