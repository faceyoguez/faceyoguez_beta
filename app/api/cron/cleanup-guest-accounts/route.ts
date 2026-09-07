import { NextResponse, NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Deletes guest (anonymous) accounts that never converted into a real
 * account within GUEST_ACCOUNT_TTL_DAYS. These are created by
 * `startGuestBrowsing()` whenever a visitor clicks a plan CTA — most never
 * come back to finish registering, and left alone they'd pile up in the
 * database forever.
 *
 * Candidates are found via the placeholder email the anonymous-signup
 * trigger stamps on them (`<id>@guest.faceyoguez.internal` — see
 * supabase/migrations/20260908000000_handle_anonymous_signup.sql). A real
 * `is_anonymous` check against the Auth Admin API is then done per
 * candidate before deleting, so a guest whose profile-row sync happened to
 * fail right after converting is never wrongly swept up.
 *
 * Wire this up to run daily the same way /api/meetings/reminders is
 * triggered, with the same `Authorization: Bearer ${CRON_SECRET}` header.
 */
const GUEST_ACCOUNT_TTL_DAYS = 7;
const GUEST_EMAIL_SUFFIX = '@guest.faceyoguez.internal';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === 'production' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const cutoff = new Date(Date.now() - GUEST_ACCOUNT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Cheap first pass — the placeholder email narrows this down to guest
    // accounts only, without scanning every user via the Admin API.
    const { data: candidates, error: fetchErr } = await admin
      .from('profiles')
      .select('id, email, created_at')
      .like('email', `%${GUEST_EMAIL_SUFFIX}`)
      .lt('created_at', cutoff);

    if (fetchErr) {
      console.error('[Cron Guest Cleanup] Error fetching candidates:', fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ success: true, message: 'No stale guest accounts found.', deleted: 0 });
    }

    let deleted = 0;
    let skipped = 0;
    const failures: string[] = [];

    for (const candidate of candidates) {
      try {
        // Confirm this is still a real anonymous account (not a converted
        // guest whose profile-row sync merely failed) before deleting.
        const { data: authUser, error: getErr } = await admin.auth.admin.getUserById(candidate.id);
        if (getErr || !authUser?.user) {
          skipped++;
          continue;
        }
        if (!authUser.user.is_anonymous) {
          skipped++;
          continue;
        }

        const { error: delErr } = await admin.auth.admin.deleteUser(candidate.id);
        if (delErr) {
          failures.push(`${candidate.id}: ${delErr.message}`);
        } else {
          deleted++;
        }
      } catch (err: any) {
        failures.push(`${candidate.id}: ${err?.message || 'unknown error'}`);
      }
    }

    console.log(`[Cron Guest Cleanup] Deleted ${deleted}, skipped ${skipped}, failed ${failures.length}`);

    return NextResponse.json({
      success: true,
      candidates: candidates.length,
      deleted,
      skipped,
      failed: failures.length,
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (err: any) {
    console.error('[Cron Guest Cleanup] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
