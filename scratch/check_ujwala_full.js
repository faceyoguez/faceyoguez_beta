const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const ujwalaAuthUsers = authUsers.users.filter(u => 
    (u.email && u.email.includes('ujwala')) || 
    (u.user_metadata && JSON.stringify(u.user_metadata).toLowerCase().includes('ujwala'))
  );
  
  console.log("=== AUTH USERS FOUND ===");
  console.log(JSON.stringify(ujwalaAuthUsers, null, 2));

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .or('full_name.ilike.%ujwala%,email.ilike.%ujwala%');

  console.log("\n=== PROFILES FOUND ===");
  console.log(JSON.stringify(profiles, null, 2));

  for (const p of profiles) {
    console.log(`\n----------------------------------------`);
    console.log(`Profile ID: ${p.id} | Name: ${p.full_name} | Email: ${p.email}`);

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', p.id);
    console.log("Subscriptions:", JSON.stringify(subs, null, 2));

    const { data: enrollments } = await supabase
      .from('batch_enrollments')
      .select('*, batches(*)')
      .eq('student_id', p.id);
    console.log("Batch Enrollments:", JSON.stringify(enrollments, null, 2));
  }
}

main();
