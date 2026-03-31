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
            title="Universal Broadcast"
            subtitle="Orchestrate wisdom across the entire platform collective."
            badge="Staff Command Center"
        />
    );
}
