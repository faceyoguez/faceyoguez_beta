'use client';

import { BroadcastClient } from '@/components/broadcast/BroadcastClient';
import type { Profile, Batch } from '@/types/database';

interface InstructorBroadcastClientProps {
    currentUser: Profile;
    batches: Partial<Batch>[];
    initialBroadcasts: any[];
}

export function InstructorBroadcastClient({ currentUser, batches, initialBroadcasts }: InstructorBroadcastClientProps) {
    return (
        <BroadcastClient
            currentUser={currentUser}
            batches={batches}
            initialBroadcasts={initialBroadcasts}
            title="Broadcast Portal"
            subtitle="Channel administrative announcements across the collective."
            badge="Information Centre"
        />
    );
}
