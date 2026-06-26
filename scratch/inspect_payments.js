const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectPayments() {
  console.log("Searching subscriptions for Nazia's email 'naziatarika7@gmail.com'...");
  const { data: subsByEmail, error: err1 } = await supabase
    .from('subscriptions')
    .select('*')
    .ilike('metadata->>email', '%naziatarika7%');
  console.log("Subs by metadata email:", subsByEmail, err1);

  console.log("\nSearching subscriptions for Nazia's phone/name in metadata...");
  const { data: subsByPhone, error: err2 } = await supabase
    .from('subscriptions')
    .select('*')
    .or('metadata->>phone.ilike.%7087877769%,metadata->>name.ilike.%Nazia%');
  console.log("Subs by metadata phone/name:", subsByPhone, err2);
  
  // Let's also check if there is an orders table or razorpay payments table
  const { data: tables, error: tErr } = await supabase
    .from('subscriptions')
    .select('metadata')
    .limit(10);
  console.log("\nSample subscription metadatas:", tables?.map(t => t.metadata));
}

inspectPayments();
