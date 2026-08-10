const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Searching profiles for 'Rashmi'...");
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .or('full_name.ilike.%rashmi%,email.ilike.%rashmi%');

  if (pError) {
    console.error('Error fetching profiles:', pError);
    return;
  }
  
  console.log(`Found ${profiles ? profiles.length : 0} profiles for Rashmi:`);
  console.log(JSON.stringify(profiles, null, 2));

  if (!profiles || profiles.length === 0) {
    return;
  }

  for (const profile of profiles) {
    console.log(`\n========================================`);
    console.log(`User: ${profile.full_name} (${profile.email})`);
    console.log(`ID: ${profile.id} | Role: ${profile.role}`);
    console.log(`Created At: ${profile.created_at}`);

    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
    if (authUser && authUser.user) {
      console.log(`Last Sign In: ${authUser.user.last_sign_in_at}`);
    }

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
  }
}

main();
