// Grant 1 year of group_session plan to joellsiby@gmail.com
// Run: node scripts/grant_group_plan.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vdeddkrsumjhzkqaeywl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZWRka3JzdW1qaHprcWFleXdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgwOTUzNSwiZXhwIjoyMDg4Mzg1NTM1fQ.Oq475KkE8k8re1FX1FaRkaLYmBkGBv_3CRVQPmRkx_w';

const TARGET_EMAIL = 'joellsiby@gmail.com';
const PLAN_TYPE = 'group_session';
const DURATION_MONTHS = 12;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // 1. Look up user by email via auth admin API
  const { data: usersData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error('Error listing users:', listErr.message);
    process.exit(1);
  }

  const user = usersData.users.find(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());
  if (!user) {
    console.error(`❌ No user found with email: ${TARGET_EMAIL}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.email} (id: ${user.id})`);

  // 2. Compute dates — 12-month active subscription
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + DURATION_MONTHS);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr   = endDate.toISOString().split('T')[0];

  // 3. Insert subscription
  const { data: sub, error: insertErr } = await admin
    .from('subscriptions')
    .insert({
      student_id: user.id,
      plan_type: PLAN_TYPE,
      status: 'active',
      duration_months: DURATION_MONTHS,
      start_date: startStr,
      end_date: endStr,
      amount: 0,            // complimentary / granted by admin
      currency: 'INR',
      payment_id: 'admin_grant',
      batches_remaining: DURATION_MONTHS,
      batches_used: 0,
      is_trial: false,
      metadata: {
        granted_by: 'admin',
        note: '1-year complimentary group plan',
      }
    })
    .select()
    .single();

  if (insertErr) {
    console.error('❌ Failed to create subscription:', insertErr.message);
    process.exit(1);
  }

  console.log('🎉 Subscription created successfully!');
  console.log(`   Plan     : ${PLAN_TYPE}`);
  console.log(`   Duration : ${DURATION_MONTHS} months`);
  console.log(`   Start    : ${startStr}`);
  console.log(`   End      : ${endStr}`);
  console.log(`   ID       : ${sub.id}`);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
