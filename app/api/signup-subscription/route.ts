import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const signupSchema = z.object({
  planType: z.enum(['one_on_one', 'group_session', 'lms']),
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, 10, 60000); // 10 requests per minute
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { planType, phone } = result.data;
    const userId = user.id;

    const admin = createAdminClient();

    // 1. Make sure the profile exists (the trigger should have created it,
    //    but update with phone if provided)
    if (phone) {
      await admin
        .from('profiles')
        .update({ phone })
        .eq('id', userId);
    }

    // 2. Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    // 3. Set pricing based on plan
    const pricing: Record<string, number> = {
      one_on_one: 4999,
      group_session: 1999,
      lms: 999,
    };

    // 4. Create subscription
    const { data: subscription, error: subError } = await admin
      .from('subscriptions')
      .insert({
        student_id: userId,
        plan_type: planType,
        status: 'active',
        duration_months: 1,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        amount: pricing[planType] || 0,
        currency: 'INR',
        payment_id: 'signup',
        batches_remaining: 1,
        batches_used: 0,
      })
      .select()
      .single();

    if (subError) {
      console.error('Subscription creation error:', subError);
      return NextResponse.json(
        { error: 'Failed to create subscription: ' + subError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    console.error('Signup subscription error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}