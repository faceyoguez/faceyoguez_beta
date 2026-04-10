import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/razorpay/subscription-status?id=<subscriptionId>
 * Verifies that a subscription exists AND belongs to the currently authenticated user.
 * Used by the purchase-success page to confirm the subscription was created.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ exists: false }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id')?.trim();

    if (!subscriptionId || subscriptionId.length < 10) {
      return NextResponse.json({ exists: false }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: sub, error } = await admin
      .from('subscriptions')
      .select('id, status, plan_type, plan_variant, amount, created_at')
      .eq('id', subscriptionId)
      .eq('student_id', user.id) // ← critical: ownership check
      .maybeSingle();

    if (error) {
      console.error('[subscription-status] DB error:', error);
      return NextResponse.json({ exists: false }, { status: 500 });
    }

    return NextResponse.json({ exists: !!sub, subscription: sub });
  } catch (err: any) {
    console.error('[subscription-status] Unhandled error:', err);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
