const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAmitha() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%amitha%');
  console.log("Amitha profile:", JSON.stringify(data, null, 2));
  
  if (data?.[0]) {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', data[0].id);
    console.log("Amitha subscriptions:", JSON.stringify(subs, null, 2));
  }
}

checkAmitha();
