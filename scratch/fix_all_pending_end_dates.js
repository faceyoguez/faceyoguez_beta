const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAllPendingEndDates() {
  console.log("Fetching all batch enrollments in active batches with pending/null-end-date subscriptions...");
  
  const { data: enrollments, error } = await supabase
    .from('batch_enrollments')
    .select(`
      id,
      student_id,
      batch_id,
      status,
      subscription_id,
      student:profiles!student_id(full_name, created_at),
      subscription:subscriptions!subscription_id(*)
    `);

  if (error) {
    console.error("Error fetching enrollments:", error);
    return;
  }

  let fixCount = 0;
  for (const e of enrollments || []) {
    const sub = e.subscription;
    if (!sub) continue;

    // We want to fix subscriptions that are pending or have null start/end dates
    if (sub.status === 'pending' || !sub.start_date || !sub.end_date) {
      console.log(`\nFixing subscription for ${e.student?.full_name}:`);
      console.log(`- Sub ID: ${sub.id} | Status: ${sub.status} | Start: ${sub.start_date} | End: ${sub.end_date}`);
      
      // Determine start date: use existing start_date, or student profile created_at, or sub created_at
      let startDateStr = sub.start_date;
      if (!startDateStr) {
        const fallbackDate = sub.created_at || e.student?.created_at || new Date().toISOString();
        startDateStr = fallbackDate.split('T')[0];
      }

      // Calculate end date based on duration_months
      const duration = sub.duration_months || 1;
      const start = new Date(startDateStr);
      const end = new Date(start);
      
      if (sub.plan_type === 'group_session') {
        if (duration === 1) {
          end.setDate(start.getDate() + 40);
        } else if (duration === 3) {
          end.setDate(start.getDate() + 110);
        } else {
          end.setMonth(start.getMonth() + duration);
        }
      } else {
        end.setMonth(start.getMonth() + duration);
      }
      
      const endDateStr = end.toISOString().split('T')[0];

      console.log(`- Action: Set status='active', start_date='${startDateStr}', end_date='${endDateStr}'`);

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          start_date: startDateStr,
          end_date: endDateStr
        })
        .eq('id', sub.id);

      if (updateError) {
        console.error(`  ERROR updating ${sub.id}:`, updateError);
      } else {
        console.log(`  ✓ Successfully updated!`);
        fixCount++;
      }
    }
  }

  // Also let's update current_students on Testbatch 1
  const BATCH_ID = 'dabb067d-c796-46eb-a437-cd05d5196a5c';
  const { data: activeEnrollments } = await supabase
    .from('batch_enrollments')
    .select('id')
    .eq('batch_id', BATCH_ID)
    .eq('status', 'active');
  
  const activeCount = activeEnrollments?.length || 0;
  console.log(`\nTestbatch 1 has ${activeCount} active enrollments. Updating current_students...`);
  
  const { error: batchUpdateErr } = await supabase
    .from('batches')
    .update({ current_students: activeCount })
    .eq('id', BATCH_ID);

  if (batchUpdateErr) {
    console.error("Error updating batch count:", batchUpdateErr);
  } else {
    console.log("✓ Successfully updated Testbatch 1 current_students count to:", activeCount);
  }

  console.log(`\nFixed ${fixCount} subscriptions in total.`);
}

fixAllPendingEndDates();
