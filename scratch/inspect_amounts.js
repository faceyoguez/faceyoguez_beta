const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectAmounts() {
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, plan_type, amount, is_trial, created_at');

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Total subscriptions: ${subs.length}`);
  const nullAmounts = subs.filter(s => s.amount === null || s.amount === undefined);
  console.log(`Subscriptions with null/undefined amount: ${nullAmounts.length}`);
  
  // Show value types
  const types = {};
  for (const s of subs) {
    const t = typeof s.amount;
    types[t] = (types[t] || 0) + 1;
  }
  console.log("Amount types distribution:", types);

  // Show some samples
  console.log("Sample subscriptions:");
  console.log(subs.slice(0, 15));
}

inspectAmounts();
