const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Searching for Ujwala in profiles and subscriptions...');
  
  // Find in profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%ujwala%');

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  console.log(`Found ${profiles.length} profiles for Ujwala:`);
  for (const p of profiles) {
    console.log(`\n- ID: ${p.id} | Name: ${p.full_name} | Email: ${p.email} | Phone: ${p.phone} | Created: ${p.created_at}`);
    
    // Find all subscriptions
    const { data: subs, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', p.id);
      
    if (subError) {
      console.error('Error fetching subs:', subError);
    } else {
      console.log(`  Subscriptions (${subs.length} found):`);
      subs.forEach((s, idx) => {
        console.log(`    Sub ${idx+1}:`);
        console.log(`      Plan Type: ${s.plan_type}`);
        console.log(`      Status: ${s.status}`);
        console.log(`      Amount: ${s.amount} ${s.currency}`);
        console.log(`      Payment ID: ${s.payment_id}`);
        console.log(`      Created At: ${s.created_at}`);
        console.log(`      Start Date: ${s.start_date}`);
        console.log(`      End Date: ${s.end_date}`);
        console.log(`      Metadata:`, s.metadata);
      });
    }
  }
}

main();
