const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Step 1: Create a helper function to run inspection SQL
  const createHelperSQL = `
    CREATE OR REPLACE FUNCTION public._dev_inspect_triggers()
    RETURNS TABLE(trigger_name text, function_name text, table_name text, func_config text[])
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = 'public'
    AS $$
      SELECT 
        tgname::text,
        proname::text,
        relname::text,
        proconfig::text[]
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE nspname = 'public' 
        AND relname IN ('batch_resources', 'student_resources');
    $$;
  `;

  // Try to create the helper function
  const { error: createErr } = await supabase.rpc('_dev_inspect_triggers').select();
  if (createErr && !createErr.message.includes('does not exist')) {
    console.log('Error calling function:', createErr.message);
  }

  // Step 2: Run fix directly using admin SQL — create a temp SQL exec helper
  const fixSQL = `
    CREATE OR REPLACE FUNCTION public._dev_fix_triggers()
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = 'public'
    AS $$
    DECLARE
      fn_name text;
      fixed_count int := 0;
    BEGIN
      -- Fix all trigger functions on batch_resources and student_resources
      FOR fn_name IN
        SELECT DISTINCT proname::text
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE nspname = 'public' 
          AND relname IN ('batch_resources', 'student_resources')
      LOOP
        EXECUTE format('ALTER FUNCTION public.%I() SET search_path = ''public''', fn_name);
        fixed_count := fixed_count + 1;
        RAISE NOTICE 'Fixed: %', fn_name;
      END LOOP;
      RETURN 'Fixed ' || fixed_count || ' functions';
    END;
    $$;
  `;

  // We can't run raw SQL via supabase-js REST directly, but we can INSERT a function via management API
  // Actually, let's try the management REST API instead
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Project ref:', projectRef);

  // Use Supabase Management API to run SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
    },
    body: JSON.stringify({ query: "SELECT 1 AS test" })
  });

  if (!response.ok) {
    const txt = await response.text();
    console.log('exec_sql RPC error (expected if not exists):', response.status, txt.slice(0, 200));
  } else {
    const data = await response.json();
    console.log('exec_sql result:', data);
  }
}

run().catch(console.error);
