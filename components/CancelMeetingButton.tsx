'use client';

import React, { useState } from 'react';
import { deleteMeeting } from '@/lib/actions/meetings';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CancelMeetingButtonProps {
  meetingId: string;
}

export function CancelMeetingButton({ meetingId }: CancelMeetingButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this meeting? An apology email will be sent to the student.')) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await deleteMeeting(meetingId);
      if (res.success) {
        toast.success('Meeting canceled and student notified!');
      } else {
        toast.error(res.error || 'Failed to cancel meeting');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel meeting');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isDeleting}
      className="h-10 px-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[8px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-1"
    >
      {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cancel'}
    </button>
  );
}
