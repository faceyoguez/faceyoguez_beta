import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  planType: z.enum(['one_on_one', 'group_session', 'lms']),
  planVariant: z.string().min(1).max(100),
  durationMonths: z.number().int().positive().max(24).optional(),
  couponCode: z.string().min(1).max(50),
});

/**
 * POST /api/razorpay/activate-free
 * Activates a subscription for free when a 100% coupon is applied.
 * Validates the coupon server-side to prevent abuse.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.flatten() }, { status: 400 });
    }

    const { planType, planVariant, durationMonths = 1, couponCode } = result.data;
    const admin = createAdminClient();

    // ── Server-side coupon validation ────────────────────────────────────
    const { data: coupon, error: couponError } = await admin
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .single();

    if (couponError || !coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }
    if (!coupon.is_active) {
      return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 });
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }
    if (coupon.discount_percentage !== 100) {
      // Only allow truly 100% coupons via this endpoint
      return NextResponse.json({ error: 'This coupon does not grant free access' }, { status: 400 });
    }
    if (coupon.course_type && coupon.course_type !== 'all' && coupon.course_type !== planType) {
      return NextResponse.json({ error: `This coupon is only valid for ${coupon.course_type} plans` }, { status: 400 });
    }

    // ── Create subscription ─────────────────────────────────────────────
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const isGroupSession = planType === 'group_session';
    const paymentId = `FREE_${couponCode}_${Date.now()}`;
    
    const { data: subscription, error: subError } = await admin.from('subscriptions').insert({
      student_id: user.id,
      plan_type: planType,
      plan_variant: planVariant,
      status: isGroupSession ? 'pending' : 'active',
      duration_months: durationMonths || 1,
      start_date: isGroupSession ? null : startDate,
      end_date: isGroupSession ? null : endDate,
      amount: 0,
      currency: 'INR',
      payment_id: paymentId,
      batches_remaining: isGroupSession ? (durationMonths || 1) : 0,
      batches_used: 0,
      metadata: {
        coupon_code: couponCode,
        activation_method: 'free_coupon',
        purchased_at: new Date().toISOString(),
      },
    }).select().single();

    if (subError || !subscription) {
      console.error('[activate-free] Subscription creation error:', subError);
      return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 });
    }

    // ── Group Session Queue Enrollment ──────────────────────────────────
    if (isGroupSession) {
      try {
        const { enrollInWaitingQueue } = await import('@/lib/actions/batches');
        await enrollInWaitingQueue(user.id, subscription.id);
      } catch (queueErr) {
        console.error('[activate-free] Queue enroll failed:', queueErr);
      }
    }

    // ── Increment coupon usage ──────────────────────────────────────────
    await admin
      .from('coupons')
      .update({ used_count: (coupon.used_count || 0) + 1 })
      .eq('code', couponCode.toUpperCase());

    // ── Notification & Conversion Tracking ──────────────────────────────
    const planLabels: Record<string, string> = {
      one_on_one: '1-on-1 Personal Plan',
      group_session: '21-Day Group Transformation',
      lms: 'Self-Paced Video Course',
    };
    try {
      await admin.from('notifications').insert({
        user_id: user.id,
        title: '🎉 Plan Activated!',
        message: `Your ${planLabels[planType] || planType} plan has been activated using a 100% free coupon.`,
        type: 'purchase_confirmation',
        is_read: false,
      });

      await admin.from('conversion_events').insert({
        session_id: paymentId,
        user_id: user.id,
        event_type: 'payment_complete',
        plan_type: planType,
        amount: 0,
        page_path: '/student/plans',
        metadata: { planVariant, couponCode, isFree: true },
      });
    } catch { /* non-fatal */ }

    // ── Revalidate caches to instantly update the user's dashboard ──────
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/student/plans');
    revalidatePath('/student/dashboard');
    revalidatePath('/student/purchase-success');

    console.log(`[activate-free] Activated ${planType}/${planVariant} for user ${user.id} using coupon ${couponCode}`);

    return NextResponse.json({ success: true, planType, planVariant });
  } catch (error: any) {
    console.error('[activate-free] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
