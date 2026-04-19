import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email/sender';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/auth/welcome
 * Sends a welcome email to a newly registered user.
 * Called immediately after client-side signUp() succeeds.
 * Rate-limited to prevent abuse.
 */
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, 3, 60_000); // 3 per minute per IP
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the profile to get the full name
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email, created_at')
      .eq('id', user.id)
      .single();

    // Guard: only send welcome email for accounts created in the last 5 minutes
    // This prevents re-triggering on re-login
    const createdAt = new Date(profile?.created_at || user.created_at);
    const ageMs = Date.now() - createdAt.getTime();
    const FIVE_MINUTES = 5 * 60 * 1000;

    if (ageMs > FIVE_MINUTES) {
      // Account is older — this isn't a new signup, skip silently
      return NextResponse.json({ skipped: true });
    }

    const email = profile?.email || user.email;
    const rawName = profile?.full_name || user.user_metadata?.full_name || 'there';
    const firstName = rawName.split(' ')[0];
    const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    await sendWelcomeEmail(email, capitalized);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[welcome-email] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
