const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: viewData, error: viewErr } = await supabase
    .from('v_student_resources')
    .select('*')
    .limit(10);

  console.log("=== v_student_resources ===");
  console.log(viewData, viewErr);
}

run();
