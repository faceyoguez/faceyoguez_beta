import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { razorpay } from '@/lib/razorpay';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

// Extended schema — now accepts 'consultation' planType
const orderSchema = z.object({
  planType: z.enum(['one_on_one', 'group_session', 'lms', 'consultation']),
  planVariant: z.string().min(1).max(100),
  amount: z.number().positive().max(500_000),
  durationMonths: z.number().int().positive().max(24).optional(),
  bumps: z.array(z.string().max(100)).max(10).optional(),
  couponCode: z.string().max(50).optional(),
  // Consultation credit: client tells us if credit should be applied (server always validates)
  applyConsultationCredit: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, 15, 60_000);
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

    const result = orderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input data', details: result.error.flatten() }, { status: 400 });
    }

    const { planType, planVariant, amount, durationMonths, bumps, couponCode, applyConsultationCredit } = result.data;

    const admin = createAdminClient();

    // Validate consultation purchase: check user doesn't already have an active/paid one
    if (planType === 'consultation') {
      const { data: existingConsultation } = await admin
        .from('consultations')
        .select('id, status')
        .eq('student_id', user.id)
        .in('status', ['paid', 'active'])
        .maybeSingle();

      if (existingConsultation) {
        return NextResponse.json(
          { error: 'You already have an active consultation. Please complete it before purchasing another.' },
          { status: 400 }
        );
      }
    }

    // Validate consultation credit on 1-on-1 plans
    let finalAmount = amount;
    let creditValidated = false;

    if (planType === 'one_on_one' && applyConsultationCredit) {
      const { data: completedConsultation } = await admin
        .from('consultations')
        .select('id, credit_applied')
        .eq('student_id', user.id)
        .eq('credit_applied', false)
        .not('paid_at', 'is', null)
        .maybeSingle();

      if (completedConsultation) {
        // Credit is valid — the ₹999 deduction is already reflected in `amount` from client
        // Server just validates the credit exists
        creditValidated = true;
      } else if (applyConsultationCredit) {
        // Client claims credit exists but it doesn't — reject
        return NextResponse.json({ error: 'Consultation credit not available.' }, { status: 400 });
      }
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .single();

    const amountInPaise = Math.round(finalAmount * 100);
    if (amountInPaise < 100) {
      return NextResponse.json({ error: 'Minimum order amount is ₹1' }, { status: 400 });
    }

    console.log('[Razorpay] Creating order:', { planType, planVariant, finalAmount, amountInPaise });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `fyg_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        userEmail: profile?.email || user.email || '',
        userName: profile?.full_name || '',
        userPhone: profile?.phone || '',
        planType,
        planVariant,
        durationMonths: String(durationMonths || 1),
        bumps: (bumps || []).join(','),
        couponCode: couponCode || '',
        consultationCredit: String(creditValidated),
        source: 'faceyoguez_web',
        environment: process.env.NODE_ENV || 'development',
      },
    });

    console.log('[Razorpay] Order created successfully:', order.id);

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    console.log('[Razorpay] Returning to client:', { orderId: order.id, keyId: keyId ? 'PRESENT' : 'MISSING' });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
    });
  } catch (error: any) {
    console.error('[Razorpay] create-order error:', error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
