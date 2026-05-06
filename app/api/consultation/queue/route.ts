import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

/** GET /api/consultation/queue — Staff gets the consultations queue */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, 30, 60_000);
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const allowedRoles = ['staff', 'admin', 'instructor', 'client_management'];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const statusFilter = request.nextUrl.searchParams.get('status') || 'paid,active';
    const statuses = statusFilter.split(',');

    const admin = createAdminClient();

    const { data: consultations } = await admin
      .from('consultations')
      .select(`
        *,
        student:profiles!student_id(id, full_name, email, phone, avatar_url),
        staff:profiles!staff_id(id, full_name),
        zoom_calls:consultation_zoom_calls(id, join_url, start_time, duration_minutes, topic),
        latest_message:consultation_messages(content, content_type, created_at, sender_id)
      `)
      .in('status', statuses)
      .order('created_at', { ascending: true });

    // Get unread message counts per consultation
    const consultationIds = (consultations || []).map(c => c.id);
    const { data: unreadCounts } = await admin
      .from('consultation_messages')
      .select('consultation_id')
      .in('consultation_id', consultationIds)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    const unreadMap: Record<string, number> = {};
    (unreadCounts || []).forEach(row => {
      unreadMap[row.consultation_id] = (unreadMap[row.consultation_id] || 0) + 1;
    });

    const enriched = (consultations || []).map(c => ({
      ...c,
      unread_count: unreadMap[c.id] || 0,
      latest_message: Array.isArray(c.latest_message)
        ? c.latest_message.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0] || null
        : c.latest_message,
      zoom_call: Array.isArray(c.zoom_calls) ? c.zoom_calls[c.zoom_calls.length - 1] || null : null,
    }));

    return NextResponse.json({ consultations: enriched });
  } catch (err: any) {
    console.error('[Consultation] queue GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
