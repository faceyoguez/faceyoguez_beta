const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectAndRemoveManishaGroup() {
  console.log("Finding Manisha Kirodiwal...");
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Manisha Kirodiwal%');

  if (pErr || !profiles || profiles.length === 0) {
    console.error("Profile not found:", pErr);
    return;
  }

  const profile = profiles[0];
  console.log(`Found profile: ${profile.full_name} (${profile.email}), ID: ${profile.id}`);

  // Fetch subscriptions
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('student_id', profile.id);

  console.log("Current Subscriptions:", subs);

  // Fetch batch enrollments
  const { data: enrollments } = await supabase
    .from('batch_enrollments')
    .select('*')
    .eq('student_id', profile.id);

  console.log("Current Batch Enrollments:", enrollments);

  // Fetch waiting queue
  const { data: queue } = await supabase
    .from('waiting_queue')
    .select('*')
    .eq('student_id', profile.id);

  console.log("Current Waiting Queue entries:", queue);

  // Perform deletions/modifications
  const groupSubs = subs.filter(s => s.plan_type === 'group_session');
  if (groupSubs.length > 0) {
    console.log(`Deleting ${groupSubs.length} group_session subscriptions...`);
    for (const sub of groupSubs) {
      const { error: dSubErr } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', sub.id);
      if (dSubErr) console.error("Error deleting subscription:", dSubErr);
      else console.log(`✓ Deleted subscription ${sub.id}`);
    }
  }

  if (enrollments.length > 0) {
    console.log(`Deleting ${enrollments.length} batch enrollments...`);
    for (const enc of enrollments) {
      const { error: dEncErr } = await supabase
        .from('batch_enrollments')
        .delete()
        .eq('id', enc.id);
      if (dEncErr) console.error("Error deleting enrollment:", dEncErr);
      else console.log(`✓ Deleted batch enrollment ${enc.id}`);
    }
  }

  if (queue.length > 0) {
    console.log(`Deleting ${queue.length} waiting queue entries...`);
    for (const q of queue) {
      const { error: dQueueErr } = await supabase
        .from('waiting_queue')
        .delete()
        .eq('id', q.id);
      if (dQueueErr) console.error("Error deleting queue entry:", dQueueErr);
      else console.log(`✓ Deleted queue entry ${q.id}`);
    }
  }

  // Double check remaining subscriptions
  const { data: finalSubs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('student_id', profile.id);

  console.log("\nRemaining Subscriptions after removal:", finalSubs);
}

inspectAndRemoveManishaGroup();
