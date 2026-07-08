// One-off admin script: grant a student 1 year of access to one-on-one, group session,
// and LMS (Level 1 + 2), bypassing the normal purchase flow. Uses the same tables/columns
// as a real purchase (see lib/actions/subscription.ts, app/api/razorpay/verify-payment/route.ts)
// so the grant behaves identically to a paid subscription everywhere else in the app.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { enrollInWaitingQueue } from '../lib/actions/batches';

const TARGET_EMAIL = 'joel1@123.com';
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
  const baseRow = {
    student_id: profile.id,
    status: 'active' as const,
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
    metadata: { granted_by: 'admin_manual_grant', reason: '1 year comp access' },
  };

  // 1. One-on-one — grants entitlement directly; instructor still needs to be
  //    assigned afterward via the staff one-on-one panel (assignInstructor), same
  //    as any normal new one-on-one signup.
  const { data: oneOnOne, error: oneOnOneErr } = await admin
    .from('subscriptions')
    .insert({ ...baseRow, plan_type: 'one_on_one', plan_variant: '12_months' })
    .select()
    .single();
  console.log('one_on_one:', oneOnOneErr ? oneOnOneErr.message : `created ${oneOnOne.id}`);

  // 2. LMS — Level 1 + 2 bundle, active immediately (LMS access is purely subscription-row based).
  const { data: lms, error: lmsErr } = await admin
    .from('subscriptions')
    .insert({ ...baseRow, plan_type: 'lms', plan_variant: 'level_1_2' })
    .select()
    .single();
  console.log('lms:', lmsErr ? lmsErr.message : `created ${lms.id}`);

  // 3. Group session — group_session subscriptions normally start 'pending' and get
  //    attached to a live batch via enrollInWaitingQueue (the same function the real
  //    purchase flow calls), so we follow that path instead of hand-rolling batch logic.
  const { data: groupSession, error: groupErr } = await admin
    .from('subscriptions')
    .insert({ ...baseRow, plan_type: 'group_session', plan_variant: '12_months', status: 'pending' })
    .select()
    .single();

  if (groupErr) {
    console.log('group_session:', groupErr.message);
  } else {
    console.log(`group_session: created ${groupSession.id}, attaching to a batch / waiting queue...`);
    const result = await enrollInWaitingQueue(profile.id, groupSession.id);
    console.log('enrollInWaitingQueue result:', JSON.stringify(result));
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
