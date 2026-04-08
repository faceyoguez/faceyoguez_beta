import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        const body = await req.json();
        const { event_type, page_path, plan_type, amount, metadata, session_id: client_session_id } = body;

        // Valid event types based on database constraints
        const validEvents = ['pricing_view', 'buy_click', 'payment_screen', 'payment_complete', 'payment_failed', 'payment_retry'];
        
        if (!validEvents.includes(event_type)) {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
        }

        const session_id = client_session_id || uuidv4();

        const { error } = await supabase
            .from('conversion_events')
            .insert({
                session_id,
                user_id: session?.user?.id || null,
                event_type,
                page_path: page_path || null,
                plan_type: plan_type || null,
                amount: amount || null,
                metadata: metadata || {}
            });

        if (error) {
            console.error('Failed to log conversion event:', error);
            return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
        }

        return NextResponse.json({ success: true, session_id });

    } catch (error: any) {
        console.error('Conversion event error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
