// One-off admin script: grant a student 1 year of one-on-one access, bypassing the
// normal purchase flow. Uses the same tables/columns as a real purchase (see
// lib/actions/subscription.ts, app/api/razorpay/verify-payment/route.ts) so the grant
// behaves identically to a paid subscription everywhere else in the app.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TARGET_EMAIL = 'joellsiby@gmail.com';
const DURATION_MONTHS = 12;

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

async function main() {
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('email', TARGET_EMAIL)
    .maybeSingle();

  if (profileError) {
    console.error('Error looking up profile:', profileError.message);
    return;
  }
  if (!profile) {
    console.log(`No account found for ${TARGET_EMAIL}. They need to sign up first — cannot grant access to a non-existent account.`);
    return;
  }

  console.log(`Found account: ${profile.full_name} (${profile.email}), role=${profile.role}, id=${profile.id}`);

  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = addMonths(today, DURATION_MONTHS);

  const { data: oneOnOne, error: oneOnOneErr } = await admin
    .from('subscriptions')
    .insert({
      student_id: profile.id,
      plan_type: 'one_on_one',
      plan_variant: '12_months',
      status: 'active',
      duration_months: DURATION_MONTHS,
      start_date: startDate,
      end_date: endDate,
      amount: 0,
      currency: 'INR',
      payment_id: null,
      batches_remaining: 1,
      batches_used: 0,
      auto_renew: false,
      is_trial: false,
      metadata: { granted_by: 'admin_manual_grant', reason: '1 year comp access - one on one' },
    })
    .select()
    .single();

  console.log('one_on_one:', oneOnOneErr ? oneOnOneErr.message : `created ${oneOnOne.id}, active ${startDate} -> ${endDate}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
