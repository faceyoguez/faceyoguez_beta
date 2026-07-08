const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
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
        WHERE relname IN ('student_resources', 'batch_resources')
      `
    });

  if (triggersError) {
    console.error("RPC Error:", triggersError);
  } else {
    console.log("Triggers:", JSON.stringify(triggers, null, 2));
  }
}

main();
