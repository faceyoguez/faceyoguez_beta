import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendThankYouEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    const admin = createAdminClient();

    // ── 1. Verify the student has no active subscription ─────────────
    const { data: activeSub } = await admin
      .from('subscriptions')
      .select('id')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .maybeSingle();

    if (activeSub) {
      return NextResponse.json({ error: 'Student still has an active subscription' }, { status: 400 });
    }

    // ── 2. Fetch the student profile ─────────────────────────────────
    const { data: profile } = await admin
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('id', studentId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // ── 3. Get the student's last subscription for plan info ─────────
    const { data: lastSub } = await admin
      .from('subscriptions')
      .select('plan_type, plan_variant, start_date')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const planType = lastSub?.plan_variant || lastSub?.plan_type || 'Face Yoga Plan';
    const memberSince = profile.created_at
      ? new Date(profile.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        })
      : 'the beginning';

    // ── 4. Fetch feedback from exit_feedbacks table ───────────────────
    const { data: feedbacks } = await admin
      .from('exit_feedbacks')
      .select('rating, comments, improvement_suggestions, plan_taken')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const feedbackResponses: { question: string; answer: string }[] = [];

    if (feedbacks) {
      if (feedbacks.rating) {
        feedbackResponses.push({
          question: 'How would you rate your overall experience?',
          answer: `${feedbacks.rating} / 5 stars`,
        });
      }
      if (feedbacks.comments) {
        feedbackResponses.push({
          question: 'How was your experience with Faceyoguez?',
          answer: feedbacks.comments,
        });
      }
      if (feedbacks.improvement_suggestions) {
        feedbackResponses.push({
          question: 'Any suggestions for improvement?',
          answer: feedbacks.improvement_suggestions,
        });
      }
    }

    if (feedbackResponses.length === 0) {
      feedbackResponses.push({
        question: 'Feedback',
        answer: 'No written feedback was provided — and that\'s absolutely okay.',
      });
    }

    // ── 5. Send the warm farewell email ──────────────────────────────
    try {
      await sendThankYouEmail({
        to: profile.email,
        studentName: profile.full_name || 'Dear Student',
        planType,
        memberSince,
        feedbackResponses,
      });
      console.log(`Thank-you email sent to ${profile.email}`);
    } catch (emailErr) {
      console.error('Failed to send thank-you email:', emailErr);
      return NextResponse.json({ error: 'Failed to send farewell email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailSent: true });
  } catch (error: any) {
    console.error('Subscription expired webhook error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
