const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  });
  if (error) {
    // If execute_sql doesn't exist, try querying directly via postgrest if we can,
    // or just fetch a standard table like profiles
    console.error('Error listing tables via RPC:', error);
    const { data: profiles, error: profError } = await supabase.from('profiles').select('*').limit(1);
    console.log('Profiles table check:', { profiles, profError });
    return;
  }
  console.log('Tables:', data);
}

main();
