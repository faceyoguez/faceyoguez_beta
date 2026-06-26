const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function searchBroad() {
  console.log("Searching profiles for 'nazia' or phone containing '7087877769'...");
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .or('full_name.ilike.%nazia%,phone.ilike.%7087877769%');
  console.log("Profiles found:", profiles);

  // Let's also check if there are any subscriptions where the student profile was deleted 
  // or maybe the subscription has metadata containing "nazia" or her phone/email.
  const { data: allRecentSubs, error: sErr } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  console.log("\nChecking subscription metadata fields dynamically for Nazia references...");
  let matchCount = 0;
  for (const sub of allRecentSubs || []) {
    const metaStr = JSON.stringify(sub.metadata || {}).toLowerCase();
    if (metaStr.includes('nazia') || metaStr.includes('7087877769') || metaStr.includes('naziatarika')) {
      console.log(`Matched Sub: ${sub.id} | Student ID: ${sub.student_id}`);
      console.log(`Metadata:`, sub.metadata);
      matchCount++;
    }
  }
  if (matchCount === 0) {
    console.log("No subscriptions matched the query string in metadata.");
  }
}

searchBroad();
