const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectUserDetailsSummary() {
  const targetEmail = 'sonum2355@gmail.com';

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', targetEmail);

  console.log('=== PROFILES ===');
  console.log(profiles);

  if (!profiles || profiles.length === 0) return;
  const userId = profiles[0].id;

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('student_id', userId);
  console.log('=== SUBSCRIPTIONS ===');
  console.log(subs);

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .or(`user_id.eq.${userId},email.ilike.${targetEmail}`);
  console.log('=== PAYMENTS ===');
  console.log(payments);

  const { data: enrollments } = await supabase
    .from('batch_enrollments')
    .select('*')
    .eq('student_id', userId);
  console.log('=== BATCH ENROLLMENTS ===');
  console.log(enrollments);

  const { data: queue } = await supabase
    .from('waiting_queue')
    .select('*')
    .eq('student_id', userId);
  console.log('=== WAITING QUEUE ===');
  console.log(queue);
}

inspectUserDetailsSummary().catch(console.error);
