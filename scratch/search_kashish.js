const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const names = ['Namarta', 'Kashish', 'Kamal', 'Neha'];
  for (const name of names) {
    console.log(`Searching for ${name}...`);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${name}%`);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      continue;
    }

    for (const p of profiles) {
      console.log(`- ID: ${p.id} | Name: ${p.full_name} | Email: ${p.email} | Phone: ${p.phone} | Created: ${p.created_at}`);
      const { data: subs, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('student_id', p.id);
      if (subError) {
        console.error('Error fetching subs:', subError);
      } else {
        console.log(`  Subscriptions:`, subs);
      }
    }
  }
}

main();
