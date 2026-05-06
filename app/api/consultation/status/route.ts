import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

/** GET /api/consultation/status — Get current user's consultation status */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, 60, 60_000);
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // Get most recent non-cancelled consultation
    const { data: consultation } = await admin
      .from('consultations')
      .select(`
        *,
        staff:profiles!staff_id(id, full_name, avatar_url),
        zoom_calls:consultation_zoom_calls(*)
      `)
      .eq('student_id', user.id)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if credit is available (paid consultation with credit not yet used)
    const { data: creditConsultation } = await admin
      .from('consultations')
      .select('id, status, credit_applied, paid_at')
      .eq('student_id', user.id)
      .eq('credit_applied', false)
      .not('paid_at', 'is', null)
      .maybeSingle();

    return NextResponse.json({
      consultation: consultation || null,
      hasCredit: !!creditConsultation,
      creditAmount: creditConsultation ? 999 : 0,
    });
  } catch (err: any) {
    console.error('[Consultation] status GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
