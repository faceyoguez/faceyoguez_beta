const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error fetching profile:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns in profiles table:', Object.keys(data[0]));
    console.log('Sample profile row:', data[0]);
  } else {
    console.log('No profiles found, but let us try to fetch table definition or insert a dummy to see errors.');
    // Let's try to insert a profile with only ID to see what fields are required/missing
    const dummyId = '00000000-0000-0000-0000-000000000000';
    const { error: insertError } = await supabase.from('profiles').insert({ id: dummyId });
    console.log('Insert error:', insertError);
  }
}

main();
