const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function searchPaymentAndOrder() {
  const searchPay = 'pay_T5XglIxCO5H07M';
  const searchOrder = 'order_T5Xga6nYvhfyFn';
  
  console.log(`Searching subscriptions for payment_id = ${searchPay} or order_id in metadata...`);
  
  // 1. Search by payment_id column
  const { data: subsByPay, error: errPay } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('payment_id', searchPay);
    
  console.log("Subscriptions matching payment_id:", subsByPay, errPay);

  // 2. Search all subscriptions to see if the order_id is in metadata
  const { data: allSubs, error: errAll } = await supabase
    .from('subscriptions')
    .select('*');
    
  if (errAll) {
    console.error("Error fetching all subscriptions:", errAll);
  } else {
    const matched = allSubs.filter(sub => {
      const meta = JSON.stringify(sub.metadata || {}).toLowerCase();
      return meta.includes(searchOrder.toLowerCase()) || meta.includes(searchPay.toLowerCase());
    });
    console.log("Subscriptions matching via metadata search:", matched);
  }
  
  // 3. Check if there are other tables like transactions or payment logs or webhooks
  // Let's run a query to inspect the database schema or list tables.
  // Actually, let's look for any tables that might store payment logs.
}

searchPaymentAndOrder();
