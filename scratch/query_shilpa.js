const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Searching for Shilpa or mittalshilpa2010@gmail.com...');
  
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .or('email.eq.mittalshilpa2010@gmail.com,full_name.ilike.%shilpa%,phone.ilike.%9216592322%');

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return;
  }

  console.log('Matching profiles in database:', profiles);

  if (profiles && profiles.length > 0) {
    for (const p of profiles) {
      const { data: subs, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('student_id', p.id);
      console.log(`Subscriptions for ${p.full_name}:`, subs);
    }
  } else {
    // If not in profiles, search auth.users
    console.log('Searching auth users...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (!authError && users) {
      const authMatch = users.filter(u => 
        u.email === 'mittalshilpa2010@gmail.com' || 
        JSON.stringify(u).includes('9216592322') ||
        JSON.stringify(u).toLowerCase().includes('shilpa')
      );
      console.log('Matching auth users:', authMatch);
    }
  }
}

main();
