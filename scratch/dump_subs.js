const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function dumpRecentSubs() {
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, student_id, amount, status, plan_type, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log(JSON.stringify(subs, null, 2));
}

dumpRecentSubs();
