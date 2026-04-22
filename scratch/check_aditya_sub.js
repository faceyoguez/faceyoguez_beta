require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .ilike('full_name', '%Aditya%');
    
  if (pError) return console.error('PError:', pError);
  
  console.log('Found Profiles:', profiles);
  
  for (const profile of profiles) {
    const { data: subs, error: sError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', profile.id)
      .eq('plan_type', 'group_session');
      
    if (sError) console.error('SError:', sError);
    else console.log(`Subscriptions for ${profile.full_name}:`, subs);
  }
}

main();
