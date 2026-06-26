const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectPendingActive() {
  console.log("Checking active subscriptions with null start/end dates:");
  const { data: activeNull, error: err1 } = await supabase
    .from('subscriptions')
    .select('id, student_id, plan_type, plan_variant, status, start_date, end_date, created_at')
    .eq('status', 'active')
    .or('start_date.is.null,end_date.is.null');

  console.log(`Active subscriptions with null dates: ${activeNull?.length}`);
  console.log(activeNull);

  console.log("\nChecking pending subscriptions with null start/end dates:");
  const { data: pendingNull, error: err2 } = await supabase
    .from('subscriptions')
    .select('id, student_id, plan_type, plan_variant, status, start_date, end_date, created_at')
    .eq('status', 'pending');

  console.log(`Pending subscriptions: ${pendingNull?.length}`);
  // Let's print details of a few
  if (pendingNull && pendingNull.length > 0) {
    console.log(pendingNull.slice(0, 10).map(s => ({
      id: s.id,
      student_id: s.student_id,
      plan_type: s.plan_type,
      plan_variant: s.plan_variant,
      created_at: s.created_at
    })));
  }

  console.log("\nChecking if any student is enrolled in a batch but has a pending or null-date subscription:");
  const { data: enrollments, error: err3 } = await supabase
    .from('batch_enrollments')
    .select(`
      id,
      student_id,
      batch_id,
      status,
      subscription_id,
      batch:batches(name, status, start_date, end_date),
      subscription:subscriptions(id, status, plan_type, start_date, end_date)
    `);

  let count = 0;
  for (const enc of enrollments || []) {
    const sub = enc.subscription;
    if (sub && (sub.status === 'pending' || !sub.start_date || !sub.end_date)) {
      console.log(`- Enrollment: ${enc.id} | Student: ${enc.student_id}`);
      console.log(`  Batch: ${enc.batch?.name} (${enc.batch?.status}) | Start: ${enc.batch?.start_date}`);
      console.log(`  Subscription: ${sub.id} | Status: ${sub.status} | Start: ${sub.start_date} | End: ${sub.end_date}`);
      count++;
    }
  }
  console.log(`Total mismatch enrollments: ${count}`);
}

inspectPendingActive();
