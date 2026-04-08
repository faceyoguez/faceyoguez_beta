import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendPaymentRecoveryEmail } from '@/lib/email';
import { razorpay } from '@/lib/razorpay';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or staff
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'staff', 'instructor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, paymentId } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Fetch student profile
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('email', email)
      .single();

    const studentName = studentProfile?.full_name || 'there';

    // Fetch failed payment details from Razorpay
    let planType = 'Wellness Plan';
    let amount = 0;

    if (paymentId) {
      try {
        const payment = (await razorpay.payments.fetch(paymentId)) as any;
        planType = payment.notes?.plan_type || payment.notes?.type || 'Wellness Plan';
        amount = Number(payment.amount) / 100;
      } catch (e) {
        console.error('Error fetching Razorpay payment:', e);
      }
    }

    await sendPaymentRecoveryEmail({
      to: email,
      studentName,
      planType,
      amount,
    });

    return NextResponse.json({ success: true, message: 'Recovery email sent' });
  } catch (error: any) {
    console.error('Send payment recovery error:', error);
    return NextResponse.json(
      { error: 'Failed to send recovery email', detail: error.message },
      { status: 500 }
    );
  }
}
