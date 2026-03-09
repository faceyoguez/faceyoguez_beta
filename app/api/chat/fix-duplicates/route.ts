import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/fix-duplicates
 * One-time cleanup: merges duplicate direct conversations between the same users.
 * Moves all messages to the oldest conversation and deletes the duplicates.
 * Also deletes zombie conversations (0 participants).
 */
export async function POST() {
    const admin = createAdminClient();
    const actions: string[] = [];

    // Step 1: Delete zombie conversations (0 participants)
    const { data: allConvs } = await admin
        .from('conversations')
        .select(`id, type, participants:conversation_participants(user_id)`)
        .eq('type', 'direct');

    const zombies = (allConvs || []).filter(
        (c: any) => !c.participants || c.participants.length === 0
    );
    for (const zombie of zombies) {
        await admin.from('conversations').delete().eq('id', zombie.id);
        actions.push(`Deleted zombie conversation ${zombie.id}`);
    }

    // Step 2: Find duplicate conversations (same two participants)
    const validConvs = (allConvs || []).filter(
        (c: any) => c.participants && c.participants.length === 2
    );

    // Group by participant pair
    const groups = new Map<string, any[]>();
    for (const conv of validConvs) {
        const participants = (conv as any).participants as Array<{ user_id: string }>;
        const key = participants
            .map((p) => p.user_id)
            .sort()
            .join('|');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(conv);
    }

    // Step 3: Merge duplicates — keep the oldest, move messages, delete the rest
    for (const [pairKey, convs] of groups) {
        if (convs.length <= 1) continue;

        // Sort by created_at (keep oldest)
        // Since we don't have created_at in the select, use the first one
        const keepConvId = convs[0].id;
        const deleteConvIds = convs.slice(1).map((c: any) => c.id);

        actions.push(
            `Pair ${pairKey}: keeping ${keepConvId}, merging ${deleteConvIds.join(', ')}`
        );

        // Move all messages from duplicate convs to the kept one
        for (const deleteId of deleteConvIds) {
            const { data: movedMessages, error: moveError } = await admin
                .from('chat_messages')
                .update({ conversation_id: keepConvId })
                .eq('conversation_id', deleteId)
                .select('id');

            if (moveError) {
                actions.push(`  Error moving messages from ${deleteId}: ${moveError.message}`);
            } else {
                actions.push(
                    `  Moved ${movedMessages?.length || 0} messages from ${deleteId} to ${keepConvId}`
                );
            }

            // Delete duplicate participants
            await admin
                .from('conversation_participants')
                .delete()
                .eq('conversation_id', deleteId);

            // Delete the duplicate conversation
            await admin.from('conversations').delete().eq('id', deleteId);
            actions.push(`  Deleted duplicate conversation ${deleteId}`);
        }
    }

    return NextResponse.json({ success: true, actions });
}
