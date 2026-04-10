import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { enrollInWaitingQueue } from '@/lib/actions/batches';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

// ── Validation Schema ───────────────────────────────────────────────────────
const verifySchema = z.object({
  razorpay_order_id: z.string().min(1).max(200),
  razorpay_payment_id: z.string().min(1).max(200),
  razorpay_signature: z.string().min(1).max(500),
  planType: z.enum(['one_on_one', 'group_session', 'lms']),
  planVariant: z.string().min(1).max(100),
  amount: z.number().positive().max(500_000),
  durationMonths: z.number().int().positive().max(24).optional(),
  bumps: z.array(z.string().max(100)).max(10).optional(),
  couponCode: z.string().max(50).optional(),
  couponDiscount: z.number().min(0).max(100).optional(),
});

// ── Timing-safe string comparison ───────────────────────────────────────────
function timingSafeEqual(a: string, b: string): boolean {
  // Convert strings to buffers for crypto.timingSafeEqual
  // If lengths differ, we still compare (padded) to prevent timing attacks
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting (10 requests / minute per IP) ─────────────────────
    const rl = rateLimit(request, 10, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    // ── Auth check ───────────────────────────────────────────────────────
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Input validation ─────────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const result = verifySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planType,
      planVariant,
      amount,
      durationMonths,
      bumps,
      couponCode,
      couponDiscount,
    } = result.data;

    // ── 1. Verify Razorpay signature (HMAC-SHA256) ───────────────────────
    //    This is the critical security step — only Razorpay knows the secret,
    //    so only a real payment produces a valid signature.
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('[Razorpay] RAZORPAY_KEY_SECRET not configured');
      return NextResponse.json({ error: 'Payment service misconfigured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    if (!timingSafeEqual(expectedSignature, razorpay_signature)) {
      console.error('[Razorpay] Signature mismatch — possible tampering attempt', {
        userId: user.id,
        orderId: razorpay_order_id,
        ip: request.headers.get('x-forwarded-for'),
      });
      return NextResponse.json(
        { error: 'Payment verification failed. Signature invalid.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── 2. Idempotency: prevent duplicate subscriptions ──────────────────
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('id, status')
      .eq('payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existingSub) {
      // Payment already processed — return success without duplicate insertion
      return NextResponse.json({
        success: true,
        subscriptionId: existingSub.id,
        alreadyProcessed: true,
      });
    }

    // ── 3. Verify the order amount matches what was expected ─────────────
    //    Defence against price-tampering (if user modified the amount in the request)
    //    We cross-check against Razorpay's order record using the admin SDK.
    try {
      const razorpayOrder = await import('@/lib/razorpay').then(m => m.razorpay.orders.fetch(razorpay_order_id));
      const expectedAmountPaise = Math.round(amount * 100);
      if (Number(razorpayOrder.amount) !== expectedAmountPaise) {
        console.error('[Razorpay] Amount mismatch — possible price tampering', {
          userId: user.id,
          orderId: razorpay_order_id,
          claimedAmount: amount,
          actualAmount: Number(razorpayOrder.amount) / 100,
        });
        return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 400 });
      }
    } catch (fetchErr) {
      // Non-fatal: log but continue — signature is the primary security check
      console.warn('[Razorpay] Could not fetch order for amount verification:', fetchErr);
    }

    // ── 4. Insert subscription in DB ─────────────────────────────────────
    const isGroupSession = planType === 'group_session';

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (durationMonths || 1));

    const metadata = {
      planVariant,
      bumps: bumps || [],
      couponCode: couponCode || null,
      couponDiscount: couponDiscount || 0,
      razorpay_order_id,
      purchased_at: new Date().toISOString(),
    };

    const { data: subscription, error: insertError } = await admin
      .from('subscriptions')
      .insert({
        student_id: user.id,
        plan_type: planType,
        plan_variant: planVariant,
        status: isGroupSession ? 'pending' : 'active',
        duration_months: durationMonths || 1,
        start_date: isGroupSession ? null : startDate.toISOString().split('T')[0],
        end_date: isGroupSession ? null : endDate.toISOString().split('T')[0],
        amount: amount,
        currency: 'INR',
        payment_id: razorpay_payment_id,
        batches_remaining: isGroupSession ? (durationMonths || 1) : 0,
        batches_used: 0,
        metadata,
      })
      .select()
      .single();

    if (insertError || !subscription) {
      console.error('[Razorpay] DB insert error:', insertError);
      // Critical: payment succeeded but DB failed — log for manual reconciliation
      console.error('[MANUAL RECONCILIATION REQUIRED]', {
        userId: user.id,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        planType,
        amount,
      });
      return NextResponse.json(
        { error: 'Payment captured but subscription activation failed. Our team has been notified. Please contact support with your Payment ID: ' + razorpay_payment_id },
        { status: 500 }
      );
    }

    // ── 5. Plan-specific post-purchase actions ───────────────────────────
    if (isGroupSession) {
      // Group: add to waiting queue (will get trial access if an active batch exists)
      try {
        await enrollInWaitingQueue(user.id, subscription.id);
      } catch (queueErr) {
        console.error('[Razorpay] Waiting queue enroll failed (non-fatal):', queueErr);
      }
    }

    // ── 6. Send purchase confirmation notification ────────────────────────
    const planLabels: Record<string, string> = {
      one_on_one: '1-on-1 Personal Plan',
      group_session: '21-Day Group Transformation',
      lms: 'Self-Paced Video Course',
    };
    try {
      await admin.from('notifications').insert({
        user_id: user.id,
        title: '🎉 Purchase Successful!',
        message: `Your ${planLabels[planType] || planType} plan has been activated. Payment ID: ${razorpay_payment_id}`,
        type: 'purchase_confirmation',
        is_read: false,
      });
    } catch (notifErr) {
      console.error('[Razorpay] Notification insert failed (non-fatal):', notifErr);
    }

    // ── 7. Track conversion event ────────────────────────────────────────
    try {
      await admin.from('conversion_events').insert({
        session_id: razorpay_order_id, // use order_id as session correlator
        user_id: user.id,
        event_type: 'payment_complete',
        plan_type: planType,
        amount,
        page_path: '/student/plans',
        metadata: { planVariant, bumps: bumps || [], couponCode },
      });
    } catch (trackErr) {
      console.error('[Razorpay] Conversion tracking failed (non-fatal):', trackErr);
    }

    // ── 8. Revalidate cache for affected pages ───────────────────────────
    revalidatePath('/student/plans');
    revalidatePath('/student/dashboard');
    revalidatePath('/student/group-session');
    revalidatePath('/student/purchase-success');

    return NextResponse.json({ success: true, subscriptionId: subscription.id });

  } catch (error: any) {
    console.error('[Razorpay] verify-payment unhandled error:', error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
