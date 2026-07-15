const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Searching for Karuna Shah, karuna.bshah@gmail.com or parts of phone number...');
  
  // Find in profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .or('email.ilike.%karuna%,full_name.ilike.%karuna%,phone.ilike.%8253%');

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return;
  }

  console.log('Matching profiles in database:', profiles);

  for (const p of profiles) {
    const { data: subs, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', p.id);
    console.log(`Subscriptions for ${p.full_name}:`, subs);
  }

  // Find in auth users
  console.log('Searching auth users...');
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (!authError && users) {
    const authMatch = users.filter(u => 
      u.email.includes('karuna') || 
      JSON.stringify(u).includes('8253') ||
      JSON.stringify(u).toLowerCase().includes('karuna')
    );
    console.log('Matching auth users:', authMatch);
  }
}

main();
