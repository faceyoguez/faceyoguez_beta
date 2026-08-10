const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Searching profiles for 'joel'...");
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .or('full_name.ilike.%joel%,email.ilike.%joel%');

  console.log("Profiles:", JSON.stringify(profiles, null, 2));

  for (const p of profiles || []) {
    console.log(`\n================ ${p.full_name} (${p.email}) ================`);
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', p.id);
    console.log("Subscriptions:", JSON.stringify(subs, null, 2));

    const { data: enrollments } = await supabase
      .from('batch_enrollments')
      .select('*, batches(*)')
      .eq('student_id', p.id);
    console.log("Enrollments:", JSON.stringify(enrollments, null, 2));
  }
}

main();
