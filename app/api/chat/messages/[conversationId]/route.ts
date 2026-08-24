import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { getWeekWindow } from '@/lib/chat-pagination';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/messages/[conversationId]
 * Fetches messages for a conversation. Uses admin client to bypass RLS.
 * Auth is verified via cookies.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { conversationId } = await params;
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            console.log('[CHAT API] Not authenticated - no user in cookies');
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const admin = createAdminClient();

        // ── Auth Check: Ensure user is a participant ──
        const { data: isParticipant } = await admin
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (!isParticipant) {
            // Also allow staff/admin to view any conversation if needed
            const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
            if (!['admin', 'staff', 'instructor', 'client_management'].includes(profile?.role || '')) {
                console.error(`[CHAT API] Access denied for user=${user.email} role=${profile?.role} conv=${conversationId}`);
                return NextResponse.json({ error: 'Forbidden. You do not have access to this conversation.' }, { status: 403 });
            }
            console.log(`[CHAT API] Admin bypass granted for user=${user.email} role=${profile?.role} conv=${conversationId}`);
        }

        const searchParams = request.nextUrl.searchParams;
        const before = searchParams.get('before') || undefined;

        // Load a week at a time: first load gets the last 7 days, each
        // subsequent "before" cursor (the oldest currently-loaded message's
        // created_at) reaches back one more week from there.
        const { windowStart, windowEnd } = getWeekWindow(before);

        // Safety cap so one very chatty week can't return an unbounded payload.
        let query = admin
            .from('chat_messages')
            .select(`*, sender:profiles!sender_id(id, full_name, avatar_url, role)`)
            .eq('conversation_id', conversationId)
            .gte('created_at', windowStart)
            .order('created_at', { ascending: false })
            .limit(500);

        if (windowEnd) {
            query = query.lt('created_at', windowEnd);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[CHAT API] DB error:', error);
            return NextResponse.json({ messages: [], hasMore: false });
        }

        const messages = (data || []).reverse();

        // Is there anything older than this window? Cheap existence check,
        // not a count — determines whether to offer "load more".
        const { data: olderExists } = await admin
            .from('chat_messages')
            .select('id')
            .eq('conversation_id', conversationId)
            .lt('created_at', windowStart)
            .limit(1)
            .maybeSingle();

        console.log(`[CHAT API] conv=${conversationId.slice(0, 8)} user=${user.email} msgs=${messages.length} hasMore=${!!olderExists}`);

        return NextResponse.json(
            { messages, hasMore: !!olderExists },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'Pragma': 'no-cache',
                },
            }
        );
    } catch (err) {
        console.error('[CHAT API] Error:', err);
        return NextResponse.json({ messages: [] });
    }
}
