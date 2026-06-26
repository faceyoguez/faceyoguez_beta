const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRazorpayPayments() {
  console.log("Checking recent checkout sessions or payments...");
  // Let's check all tables to see if we have a table related to orders or payments
  const { data: logs, error: lErr } = await supabase
    .from('subscriptions')
    .select('payment_id, amount, created_at, status')
    .order('created_at', { ascending: false })
    .limit(30);

  console.log("Recent subscriptions check:");
  console.log(logs);
}

checkRazorpayPayments();
