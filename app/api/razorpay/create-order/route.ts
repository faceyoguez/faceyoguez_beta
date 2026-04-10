import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { razorpay } from '@/lib/razorpay';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const orderSchema = z.object({
  planType: z.enum(['one_on_one', 'group_session', 'lms']),
  planVariant: z.string().min(1).max(100),
  amount: z.number().positive().max(500_000), // cap at ₹5L as a sanity guard
  durationMonths: z.number().int().positive().max(24).optional(),
  bumps: z.array(z.string().max(100)).max(10).optional(),
  couponCode: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting (15 requests / minute per IP) ─────────────────────
    const rl = rateLimit(request, 15, 60_000);
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

    const result = orderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { planType, planVariant, amount, durationMonths, bumps, couponCode } = result.data;

    // ── Fetch user profile for Razorpay notes (visibility in dashboard) ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .single();

    // ── Amount must be in paise (INR × 100) ──────────────────────────────
    const amountInPaise = Math.round(amount * 100);

    // Razorpay minimum order is ₹1 (100 paise)
    if (amountInPaise < 100) {
      return NextResponse.json({ error: 'Minimum order amount is ₹1' }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `fyg_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        // Rich notes visible in Razorpay Dashboard → Payments
        userId: user.id,
        userEmail: profile?.email || user.email || '',
        userName: profile?.full_name || '',
        userPhone: profile?.phone || '',
        planType,
        planVariant,
        durationMonths: String(durationMonths || 1),
        bumps: (bumps || []).join(','),
        couponCode: couponCode || '',
        source: 'faceyoguez_web',
        environment: process.env.NODE_ENV || 'development',
      },
    });

    // Return ONLY the public key — NEVER the secret
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      // Prefer NEXT_PUBLIC variant, fall back to server-only key (both are safe — key_id is public)
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('[Razorpay] create-order error:', error);
    // Don't leak internal error details to the client in production
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
