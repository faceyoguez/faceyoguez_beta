import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { enrollInWaitingQueue } from '@/lib/actions/batches';

// ── Webhook signature verification ─────────────────────────────────────────
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // ── 1. Read raw body (must be raw, before any JSON parsing, for HMAC) ──
  const rawBody = await request.text();
  const webhookSignature = request.headers.get('x-razorpay-signature');

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // ── 2. Signature verification ────────────────────────────────────────────
  if (!webhookSecret) {
    // In production this must be configured; in dev we warn and skip verification
    if (process.env.NODE_ENV === 'production') {
      console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET not configured — rejecting request');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    } else {
      console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET missing — skipping signature verification in dev mode');
    }
  } else {
    if (!webhookSignature) {
      console.warn('[Webhook] Missing x-razorpay-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!verifyWebhookSignature(rawBody, webhookSignature, webhookSecret)) {
      console.error('[Webhook] Signature verification failed — possible spoofed request', {
        ip: request.headers.get('x-forwarded-for'),
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  // ── 3. Parse event payload ───────────────────────────────────────────────
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error('[Webhook] Failed to parse JSON body');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType: string = event?.event;
  if (!eventType) {
    return NextResponse.json({ error: 'Missing event type' }, { status: 400 });
  }

  console.log(`[Webhook] Received event: ${eventType}`);

  try {
    // ── 4. Route by event type ─────────────────────────────────────────
    switch (eventType) {

      case 'payment.captured': {
        await handlePaymentCaptured(event.payload?.payment?.entity);
        break;
      }

      case 'payment.failed': {
        await handlePaymentFailed(event.payload?.payment?.entity);
        break;
      }

      case 'order.paid': {
        // order.paid fires after payment.captured — use as a secondary confirmation
        // Already handled via payment.captured; log only
        console.log(`[Webhook] order.paid for order: ${event.payload?.order?.entity?.id}`);
        break;
      }

      case 'refund.created':
      case 'refund.processed': {
        await handleRefund(event.payload?.refund?.entity);
        break;
      }

      default: {
        // Acknowledge but don't process unknown events
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err: any) {
    console.error(`[Webhook] Error handling event ${eventType}:`, err);
    // Return 200 to prevent Razorpay from retrying on our internal errors
    // (retries should only happen if we return 4xx/5xx on the webhook response)
    return NextResponse.json({ received: true, warning: 'Event processing failed internally' }, { status: 200 });
  }
}

// ── Event Handlers ──────────────────────────────────────────────────────────

/**
 * Safety net: payment.captured fires when Razorpay bank-confirms a payment.
 * The client-side verify-payment API should already have created the subscription,
 * so this is an idempotent fallback for cases where:
 * - The user closed the browser before verify-payment completed
 * - The verify-payment API call failed due to network issues
 * - The Razorpay checkout success callback was not triggered
 */
async function handlePaymentCaptured(payment: any) {
  if (!payment) {
    console.warn('[Webhook/captured] Empty payment payload');
    return;
  }

  const paymentId: string = payment.id;
  const orderId: string = payment.order_id;
  const notes: Record<string, string> = payment.notes || {};

  // Extract user context from order notes (set during create-order)
  const userId: string | undefined = notes.userId;
  const planType: string | undefined = notes.planType;
  const planVariant: string | undefined = notes.planVariant;
  const durationMonths: number = parseInt(notes.durationMonths || '1', 10) || 1;
  const bumps: string[] = notes.bumps ? notes.bumps.split(',').filter(Boolean) : [];
  const couponCode: string | undefined = notes.couponCode || undefined;
  const amountINR: number = payment.amount / 100; // convert paise to INR

  if (!userId || !planType || !planVariant) {
    console.error('[Webhook/captured] Missing required notes fields — cannot create subscription', {
      paymentId,
      notes,
    });
    return;
  }

  const admin = createAdminClient();

  // Idempotency check
  const { data: existing } = await admin
    .from('subscriptions')
    .select('id')
    .eq('payment_id', paymentId)
    .maybeSingle();

  if (existing) {
    console.log(`[Webhook/captured] Subscription already exists for payment ${paymentId} — skipping`);
    return;
  }

  const isGroupSession = planType === 'group_session';
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);

  const { data: subscription, error } = await admin
    .from('subscriptions')
    .insert({
      student_id: userId,
      plan_type: planType as any,
      plan_variant: planVariant,
      status: isGroupSession ? 'pending' : 'active',
      duration_months: durationMonths,
      start_date: isGroupSession ? null : startDate.toISOString().split('T')[0],
      end_date: isGroupSession ? null : endDate.toISOString().split('T')[0],
      amount: amountINR,
      currency: 'INR',
      payment_id: paymentId,
      batches_remaining: isGroupSession ? durationMonths : 0,
      batches_used: 0,
      metadata: {
        planVariant,
        bumps,
        couponCode: couponCode || null,
        razorpay_order_id: orderId,
        created_via: 'webhook_fallback',
        purchased_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (error) {
    console.error('[Webhook/captured] DB insert error:', error, { paymentId, userId });
    return;
  }

  console.log(`[Webhook/captured] Subscription created via webhook fallback: ${subscription.id}`);

  // Group: enroll in waiting queue
  if (isGroupSession && subscription) {
    try {
      await enrollInWaitingQueue(userId, subscription.id);
    } catch (e) {
      console.error('[Webhook/captured] Waiting queue enroll failed:', e);
    }
  }

  // Send notification
  try {
    const planLabels: Record<string, string> = {
      one_on_one: '1-on-1 Personal Plan',
      group_session: '21-Day Group Transformation',
      lms: 'Self-Paced Video Course',
    };
    await admin.from('notifications').insert({
      user_id: userId,
      title: '🎉 Purchase Confirmed!',
      message: `Your ${planLabels[planType] || planType} plan is now active. Payment ID: ${paymentId}`,
      type: 'purchase_confirmation',
      is_read: false,
    });
  } catch (e) {
    console.error('[Webhook/captured] Notification insert failed:', e);
  }
}

/**
 * Handles payment failure events — logs and optionally marks any pending
 * subscription as cancelled (to prevent orphaned pending records).
 */
async function handlePaymentFailed(payment: any) {
  if (!payment) return;

  const paymentId: string = payment.id;
  const orderId: string = payment.order_id;
  const errorDescription: string = payment.error_description || 'Unknown error';

  console.warn(`[Webhook/failed] Payment ${paymentId} on order ${orderId} failed: ${errorDescription}`);

  // No subscription should have been created for a failed payment,
  // but log for visibility in application logs / external monitoring.
  const admin = createAdminClient();
  try {
    await admin.from('conversion_events').insert({
      session_id: orderId,
      user_id: payment.notes?.userId || null,
      event_type: 'payment_failed',
      plan_type: payment.notes?.planType || null,
      amount: payment.amount ? payment.amount / 100 : null,
      page_path: '/student/plans',
      metadata: {
        paymentId,
        errorCode: payment.error_code,
        errorDescription,
      },
    });
  } catch (e) {
    console.error('[Webhook/failed] Conversion event insert failed:', e);
  }
}

/**
 * Handles refund events — logs for now; extend to update subscription status in production.
 */
async function handleRefund(refund: any) {
  if (!refund) return;
  console.log(`[Webhook/refund] Refund ${refund.id} for payment ${refund.payment_id} — amount: ₹${refund.amount / 100}`);
  // TODO: Update subscription status to 'cancelled' on full refund
}
