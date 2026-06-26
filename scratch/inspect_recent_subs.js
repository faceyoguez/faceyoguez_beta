const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentSubs() {
  console.log("Fetching all subscriptions created since 2026-06-23...");
  const { data: subs, error: sErr } = await supabase
    .from('subscriptions')
    .select(`
      *,
      student:profiles!student_id(id, full_name, email, phone)
    `)
    .gte('created_at', '2026-06-23T00:00:00+00:00')
    .order('created_at', { ascending: false });

  if (sErr) {
    console.error("Sub error:", sErr);
    return;
  }

  console.log(`Found ${subs?.length} subscriptions since June 23rd:`);
  for (const s of subs || []) {
    console.log(`- Sub ID: ${s.id} | Plan: ${s.plan_type} | Status: ${s.status} | Amt: ${s.amount} | Date: ${s.created_at}`);
    console.log(`  Student: ${s.student?.full_name} (${s.student?.email}) | Phone: ${s.student?.phone}`);
    console.log(`  Metadata:`, s.metadata);
  }
}

checkRecentSubs();
