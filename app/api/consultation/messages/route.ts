import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

/** GET /api/consultation/messages?consultationId=xxx */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, 60, 60_000);
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const consultationId = request.nextUrl.searchParams.get('consultationId');
    if (!consultationId) return NextResponse.json({ error: 'consultationId required' }, { status: 400 });

    const admin = createAdminClient();

    // Verify access to this consultation
    const { data: consultation } = await admin
      .from('consultations')
      .select('id, student_id, staff_id')
      .eq('id', consultationId)
      .single();

    if (!consultation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    const staffRoles = ['staff', 'admin', 'instructor', 'client_management'];
    const isStaff = profile && staffRoles.includes(profile.role);
    const isStudent = consultation.student_id === user.id;

    if (!isStaff && !isStudent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: messages } = await admin
      .from('consultation_messages')
      .select('*, sender:profiles!sender_id(id, full_name, role, avatar_url)')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: true });

    // Mark messages as read for this user
    if (messages && messages.length > 0) {
      await admin
        .from('consultation_messages')
        .update({ is_read: true })
        .eq('consultation_id', consultationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (err: any) {
    console.error('[Consultation] messages GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST /api/consultation/messages — Send a message */
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, 30, 60_000);
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { consultationId, content, content_type = 'text', file_url, file_name, file_size } = await request.json();

    if (!consultationId) return NextResponse.json({ error: 'consultationId required' }, { status: 400 });
    if (!content && !file_url) return NextResponse.json({ error: 'content or file_url required' }, { status: 400 });

    const admin = createAdminClient();

    // Verify access
    const { data: consultation } = await admin
      .from('consultations')
      .select('id, student_id, staff_id, status')
      .eq('id', consultationId)
      .single();

    if (!consultation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (consultation.status === 'completed') {
      return NextResponse.json({ error: 'This consultation has been completed.' }, { status: 400 });
    }

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    const staffRoles = ['staff', 'admin', 'instructor', 'client_management'];
    const isStaff = profile && staffRoles.includes(profile.role);
    const isStudent = consultation.student_id === user.id;

    if (!isStaff && !isStudent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: message, error } = await admin
      .from('consultation_messages')
      .insert({
        consultation_id: consultationId,
        sender_id: user.id,
        content: content || null,
        content_type,
        file_url: file_url || null,
        file_name: file_name || null,
        file_size: file_size || null,
        is_read: false,
      })
      .select('*, sender:profiles!sender_id(id, full_name, role, avatar_url)')
      .single();

    if (error) {
      console.error('[Consultation] message insert error:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (err: any) {
    console.error('[Consultation] messages POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
