const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Searching profiles for 'Ujwala'...");
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .ilike('full_name', '%ujwala%');

  if (pError) {
    console.error('Error fetching profiles:', pError);
    return;
  }
  
  console.log('Profiles found:', profiles);

  for (const profile of profiles) {
    console.log(`\n========================================`);
    console.log(`User: ${profile.full_name} (${profile.email})`);
    console.log(`Role: ${profile.role}`);
    console.log(`Created At: ${profile.created_at}`);

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    console.log('Subscriptions:', JSON.stringify(subs, null, 2));

    const { data: enrollments } = await supabase
      .from('batch_enrollments')
      .select('*, batches(*)')
      .eq('student_id', profile.id);
    console.log('Batch Enrollments:', JSON.stringify(enrollments, null, 2));

    const { data: logs } = await supabase
      .from('journey_logs')
      .select('*')
      .eq('student_id', profile.id)
      .order('day_number', { ascending: true });
    console.log('Journey Logs:', JSON.stringify(logs, null, 2));
  }
}

main();
