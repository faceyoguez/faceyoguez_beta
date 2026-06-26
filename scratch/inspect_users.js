const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Searching profiles for 'Manisha' or 'Lavish'...");
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .or('full_name.ilike.%manisha%,full_name.ilike.%lavish%');

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

    const { data: subs, error: sError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });

    if (sError) {
      console.error('Error fetching subscriptions:', sError);
    } else {
      console.log('Subscriptions:', subs);
    }

    const { data: enrollments, error: eError } = await supabase
      .from('batch_enrollments')
      .select('*')
      .eq('student_id', profile.id);

    if (eError) {
      console.error('Error fetching enrollments:', eError);
    } else {
      console.log('Batch Enrollments:', enrollments);
    }
  }
}

main();
