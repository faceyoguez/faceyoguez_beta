import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendRenewalReminderEmail } from '@/lib/email';
import { differenceInDays, format } from 'date-fns';

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

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Fetch student profile and their active subscription
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email)
      .single();

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', studentProfile.id || (await supabase.from('profiles').select('id').eq('email', email).single()).data?.id)
      .eq('status', 'active')
      .order('end_date', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found for this student' }, { status: 404 });
    }

    const expiryDate = new Date(subscription.end_date);
    const daysRemaining = differenceInDays(expiryDate, new Date());

    await sendRenewalReminderEmail({
      to: email,
      studentName: studentProfile.full_name,
      planType: subscription.plan_type,
      daysRemaining: Math.max(0, daysRemaining),
      expiryDate: format(expiryDate, 'dd MMM yyyy'),
    });

    return NextResponse.json({ success: true, message: 'Renewal reminder sent' });
  } catch (error: any) {
    console.error('Send renewal reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder', detail: error.message },
      { status: 500 }
    );
  }
}
