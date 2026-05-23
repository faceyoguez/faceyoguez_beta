const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Querying triggers on auth.users and profiles...');
  
  // Query all triggers in the database
  const { data: triggers, error: triggersError } = await supabase
    .rpc('execute_sql', {
      query: `
        SELECT 
          tgname as trigger_name,
          relname as table_name,
          nspname as schema_name,
          proname as function_name,
          prosrc as function_source
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE nspname IN ('auth', 'public')
      `
    });

  if (triggersError) {
    console.log('Failed to run execute_sql RPC directly. Let us try querying pg_proc via postgres_changes or standard queries.');
    console.error(triggersError);
    
    // Let's try to query using postgrest on some pg_ catalog tables if exposed, 
    // or see if there is an existing execute_sql rpc we can call
    const { data: rpcTest, error: rpcError } = await supabase.rpc('get_dashboard_layout_data', { p_user_id: '00000000-0000-0000-0000-000000000000' });
    console.log('RPC Test result:', { data: rpcTest, error: rpcError });
  } else {
    console.log('Triggers found:', triggers);
  }
}

main();
