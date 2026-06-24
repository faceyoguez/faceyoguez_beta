const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Querying 5 most recent subscriptions...');
  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select('id, student_id, plan_type, status, amount, payment_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (subsError) {
    console.error('Error fetching subscriptions:', subsError);
  } else {
    console.log('Subscriptions:', subs);
  }
}

main();
