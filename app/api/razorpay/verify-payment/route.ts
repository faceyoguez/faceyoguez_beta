import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { enrollInWaitingQueue } from '@/lib/actions/batches';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { sendInvoiceEmail } from '@/lib/email/sender';
import {
  sendConsultationReceiptEmail,
  sendConsultationPostNudgeEmail,
} from '@/lib/email/sender';

// ── Validation Schema ───────────────────────────────────────────────────────
const verifySchema = z.object({
  razorpay_order_id: z.string().min(1).max(200),
  razorpay_payment_id: z.string().min(1).max(200),
  razorpay_signature: z.string().min(1).max(500),
  planType: z.enum(['one_on_one', 'group_session', 'lms', 'consultation']),
  planVariant: z.string().min(1).max(100),
  amount: z.number().positive().max(500_000),
  durationMonths: z.number().int().positive().max(24).optional(),
  bumps: z.array(z.string().max(100)).max(10).optional(),
  couponCode: z.string().max(50).optional(),
  couponDiscount: z.number().min(0).max(100).optional(),
  applyConsultationCredit: z.boolean().optional(),
});

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, 10, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const result = verifySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input data', details: result.error.flatten() }, { status: 400 });
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
      applyConsultationCredit,
    } = result.data;

    // ── 1. Verify Razorpay signature ─────────────────────────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Payment service misconfigured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!timingSafeEqual(expectedSignature, razorpay_signature)) {
      console.error('[Razorpay] Signature mismatch', { userId: user.id, orderId: razorpay_order_id });
      return NextResponse.json({ error: 'Payment verification failed. Signature invalid.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch user profile for email
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .single();

    const userEmail = profile?.email || user.email;
    const rawName = profile?.full_name || user.user_metadata?.full_name || 'there';
    const firstName = rawName.split(' ')[0];
    const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    // ── CONSULTATION PAYMENT ──────────────────────────────────────────────────
    if (planType === 'consultation') {
      // Idempotency check
      const { data: existingConsultation } = await admin
        .from('consultations')
        .select('id')
        .eq('payment_id', razorpay_payment_id)
        .maybeSingle();

      if (existingConsultation) {
        return NextResponse.json({ success: true, consultationId: existingConsultation.id, alreadyProcessed: true });
      }

      // Insert consultation
      const { data: consultation, error: insertError } = await admin
        .from('consultations')
        .insert({
          student_id: user.id,
          payment_id: razorpay_payment_id,
          razorpay_order_id,
          amount: 999,
          currency: 'INR',
          status: 'paid',
          credit_applied: false,
          paid_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError || !consultation) {
        console.error('[Consultation] DB insert error:', insertError);
        return NextResponse.json(
          { error: 'Payment captured but consultation creation failed. Contact support with Payment ID: ' + razorpay_payment_id },
          { status: 500 }
        );
      }

      // Send consultation receipt email
      try {
        if (userEmail) {
          sendConsultationReceiptEmail(userEmail, {
            firstName: formattedName,
            paymentId: razorpay_payment_id,
            consultationId: consultation.id,
            purchasedAt: new Date(),
          }).catch(err => console.error('[Email] Consultation receipt failed:', err));
        }
      } catch (emailErr) {
        console.error('[Email] Consultation receipt setup failed:', emailErr);
      }

      // Notify user
      try {
        await admin.from('notifications').insert({
          user_id: user.id,
          title: '✅ Consultation Booked!',
          message: 'Your consultation is confirmed! Our team will connect with you soon. Your ₹999 will be credited when you purchase a 1-on-1 plan.',
          type: 'consultation_purchased',
          is_read: false,
        });
      } catch { /* non-fatal */ }

      revalidatePath('/student/consultation');
      revalidatePath('/student/plans');
      revalidatePath('/staff/consultations');

      return NextResponse.json({ success: true, consultationId: consultation.id, type: 'consultation' });
    }

    // ── REGULAR PLAN PAYMENT ──────────────────────────────────────────────────

    // Idempotency
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('id, status')
      .eq('payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existingSub) {
      return NextResponse.json({ success: true, subscriptionId: existingSub.id, alreadyProcessed: true });
    }

    // Amount verification
    try {
      const razorpayOrder = await import('@/lib/razorpay').then(m => m.razorpay.orders.fetch(razorpay_order_id));
      const expectedAmountPaise = Math.round(amount * 100);
      if (Number(razorpayOrder.amount) !== expectedAmountPaise) {
        return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 400 });
      }
    } catch (fetchErr) {
      console.warn('[Razorpay] Could not fetch order for amount verification:', fetchErr);
    }

    // Validate consultation credit if claimed
    let consultationIdForCredit: string | null = null;
    if (planType === 'one_on_one' && applyConsultationCredit) {
      const { data: creditConsultation } = await admin
        .from('consultations')
        .select('id, credit_applied')
        .eq('student_id', user.id)
        .eq('credit_applied', false)
        .not('paid_at', 'is', null)
        .maybeSingle();

      if (creditConsultation) {
        consultationIdForCredit = creditConsultation.id;
      }
    }

    // Insert subscription
    const isGroupSession = planType === 'group_session';
    const startDate = new Date();
    const endDate = new Date();
    if (isGroupSession) {
      if (durationMonths === 1) {
        endDate.setDate(endDate.getDate() + 40);
      } else if (durationMonths === 3) {
        endDate.setDate(endDate.getDate() + 110);
      } else {
        endDate.setMonth(endDate.getMonth() + (durationMonths || 1));
      }
    } else {
      endDate.setMonth(endDate.getMonth() + (durationMonths || 1));
    }

    const metadata: Record<string, unknown> = {
      planVariant,
      bumps: bumps || [],
      couponCode: couponCode || null,
      couponDiscount: couponDiscount || 0,
      razorpay_order_id,
      purchased_at: new Date().toISOString(),
      consultation_credit_applied: !!consultationIdForCredit,
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
        amount,
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
      return NextResponse.json(
        { error: 'Payment captured but subscription activation failed. Contact support with Payment ID: ' + razorpay_payment_id },
        { status: 500 }
      );
    }

    // Mark consultation credit as used
    if (consultationIdForCredit) {
      await admin
        .from('consultations')
        .update({
          credit_applied: true,
          credit_applied_at: new Date().toISOString(),
          credit_subscription_id: subscription.id,
        })
        .eq('id', consultationIdForCredit);
    }

    // Group session queue
    if (isGroupSession) {
      try {
        await enrollInWaitingQueue(user.id, subscription.id);
      } catch (queueErr) {
        console.error('[Razorpay] Queue enroll failed (non-fatal):', queueErr);
      }
    }

    // Notification
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
    } catch { /* non-fatal */ }

    // Invoice email
    try {
      if (userEmail) {
        sendInvoiceEmail(userEmail, {
          firstName: formattedName,
          planType,
          planVariant,
          amount,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          purchasedAt: new Date(),
          couponCode: couponCode || null,
          couponDiscount: couponDiscount || 0,
          durationMonths: durationMonths || 1,
        }).catch(err => console.error('[Email] Invoice failed (non-fatal):', err));
      }
    } catch { /* non-fatal */ }

    // Conversion tracking
    try {
      await admin.from('conversion_events').insert({
        session_id: razorpay_order_id,
        user_id: user.id,
        event_type: 'payment_complete',
        plan_type: planType,
        amount,
        page_path: '/student/plans',
        metadata: { planVariant, bumps: bumps || [], couponCode, consultationCreditUsed: !!consultationIdForCredit },
      });
    } catch { /* non-fatal */ }

    revalidatePath('/student/plans');
    revalidatePath('/student/dashboard');
    revalidatePath('/student/consultation');
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
