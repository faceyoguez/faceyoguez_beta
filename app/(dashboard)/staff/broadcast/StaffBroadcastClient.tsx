'use client';

import { BroadcastClient } from '@/components/broadcast/BroadcastClient';
import type { Profile, Batch } from '@/types/database';

interface StaffBroadcastClientProps {
    currentUser: Profile;
    batches: Partial<Batch>[];
    initialBroadcasts: any[];
}

export function StaffBroadcastClient({ currentUser, batches, initialBroadcasts }: StaffBroadcastClientProps) {
    return (
        <BroadcastClient
            currentUser={currentUser}
            batches={batches}
            initialBroadcasts={initialBroadcasts}
            title="Platform Announcements"
            subtitle="Send important updates and batch-wise notifications to students."
            badge="Staff Admin Center"
        />
    );
}
