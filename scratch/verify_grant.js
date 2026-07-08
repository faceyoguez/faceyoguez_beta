const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const studentId = '15a8fa4b-44c4-441e-9c60-5001235d860d';

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, plan_type, plan_variant, status, start_date, end_date, duration_months')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('Recent subscriptions:', JSON.stringify(subs, null, 2));

  const { data: queue } = await supabase
    .from('waiting_queue')
    .select('id, subscription_id, status, created_at')
    .eq('student_id', studentId);
  console.log('Waiting queue rows:', JSON.stringify(queue, null, 2));

  const { data: enrollments } = await supabase
    .from('batch_enrollments')
    .select('id, batch_id, subscription_id, status, effective_end_date')
    .eq('student_id', studentId);
  console.log('Batch enrollments:', JSON.stringify(enrollments, null, 2));
}

main().then(() => process.exit(0));
