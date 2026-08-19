const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectUserDetails() {
  const targetEmail = 'sonum2355@gmail.com';
  console.log(`=== Target Email: ${targetEmail} ===\n`);

  // 1. Profiles
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', targetEmail);

  console.log('1. PROFILES:', JSON.stringify(profiles, null, 2));

  if (!profiles || profiles.length === 0) {
    console.log('Checking auth.users directly via admin client...');
    const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
    const foundAuth = authUsers?.users?.filter(u => u.email?.toLowerCase().includes('sonum'));
    console.log('AUTH USERS matching sonum:', foundAuth);
    return;
  }

  const userId = profiles[0].id;

  // 2. Subscriptions
  const { data: subs, error: subsErr } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('student_id', userId);
  console.log('\n2. SUBSCRIPTIONS:', JSON.stringify(subs, null, 2));

  // 3. Payments
  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('*')
    .or(`user_id.eq.${userId},email.ilike.${targetEmail}`);
  console.log('\n3. PAYMENTS:', JSON.stringify(payments, null, 2));

  // 4. Batch Enrollments
  const { data: enrollments, error: enrollErr } = await supabase
    .from('batch_enrollments')
    .select('*, batch:batch_id(*)')
    .eq('student_id', userId);
  console.log('\n4. BATCH ENROLLMENTS:', JSON.stringify(enrollments, null, 2));

  // 5. Waiting Queue
  const { data: queue, error: queueErr } = await supabase
    .from('waiting_queue')
    .select('*')
    .eq('student_id', userId);
  console.log('\n5. WAITING QUEUE:', JSON.stringify(queue, null, 2));

  // 6. Check active batch enrollments or status
  if (enrollments && enrollments.length > 0) {
    for (const enc of enrollments) {
      console.log(`\n6. ENROLLED BATCH (${enc.batch_id}):`, JSON.stringify(enc.batch, null, 2));
      const { data: batchMeetings } = await supabase
        .from('meetings')
        .select('id, topic, start_time, duration_minutes, meeting_type, calendar_event_id')
        .eq('batch_id', enc.batch_id)
        .order('start_time', { ascending: false });
      console.log(`\n7. MEETINGS IN BATCH (${batchMeetings?.length} total):`, JSON.stringify(batchMeetings, null, 2));
    }
  } else {
    console.log('\n6. USER IS NOT ENROLLED IN ANY BATCH!');
  }
}

inspectUserDetails().catch(console.error);
