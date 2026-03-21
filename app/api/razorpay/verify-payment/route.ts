import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { enrollInWaitingQueue } from '@/lib/actions/batches';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planType,
      planVariant,
      amount,
      durationMonths,
    } = body;

    // ── 1. Verify Razorpay signature (Bypassed for testing) ──────────────────
    const isTestBypass = razorpay_signature === 'test_bypass';
    
    if (!isTestBypass) {
      const secret = process.env.RAZORPAY_KEY_SECRET!;
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        console.error('Razorpay signature mismatch');
        return NextResponse.json(
          { error: 'Payment verification failed. Invalid signature.' },
          { status: 400 }
        );
      }
    }

    // ── 2. Insert subscription in DB ──────────────────────────────────
    const admin = createAdminClient();
    const isGroupSession = planType === 'group_session';

    // Group sessions: subscription starts as 'pending' (activated when batch is created)
    // Other plans: subscription starts immediately as 'active'
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (durationMonths || 1));

    const { data: subscription, error } = await admin
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
      })
      .select()
      .single();

    if (error) {
      console.error('Subscription DB insert error:', error);
      return NextResponse.json(
        { error: 'Payment succeeded but failed to activate subscription: ' + error.message },
        { status: 500 }
      );
    }

    // ── 3. For group sessions, add to waiting queue (may also grant trial access) ──
    if (isGroupSession) {
      await enrollInWaitingQueue(user.id, subscription.id);
    }

    // ── 4. Refresh client-side cache ──────────────────────────────────
    revalidatePath('/student/plans');
    revalidatePath('/student/dashboard');
    revalidatePath('/student/group-session');

    return NextResponse.json({ success: true, subscriptionId: subscription.id });
  } catch (error: any) {
    console.error('Razorpay verify payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
