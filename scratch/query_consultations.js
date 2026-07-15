const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Querying consultations to check for matching phone numbers...');
  
  // Let's query consultations
  const { data: consultations, error: consError } = await supabase
    .from('consultations')
    .select('*');

  if (consError) {
    console.error('Error fetching consultations:', consError);
  } else {
    console.log(`Total consultations found: ${consultations.length}`);
    // Check if any metadata or phone contains 82535923
    consultations.forEach(c => {
      const matchStr = JSON.stringify(c).toLowerCase();
      if (matchStr.includes('82535923') || matchStr.includes('82535') || matchStr.includes('5923')) {
        console.log('Match in consultations:', c);
      }
    });
  }

  // Let's search for the phone number 82535923 or similar in any tables or fields.
  // Wait, let's list all tables in Supabase public schema by checking what's available
  // or query the list of tables from postgres.
  const { data: tables, error: tablesError } = await supabase.rpc('get_tables'); // standard rpc helper if exists
  if (tablesError) {
    // If RPC doesn't exist, we can try running a custom query or querying pg_class
    // In postgrest, we can't run raw SQL directly unless we have an RPC.
    console.log('No get_tables RPC, checking typical tables...');
  } else {
    console.log('Tables:', tables);
  }
}

main();
