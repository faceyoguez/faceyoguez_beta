const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectPavithra() {
  const email = 'pavithra1680@gmail.com';
  console.log(`Searching profile for ${email}...`);
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (!profile) {
    console.log("No profile found.");
    return;
  }

  console.log("Profile:", profile);

  console.log("\nSubscriptions:");
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('student_id', profile.id)
    .order('created_at', { ascending: false });

  console.log(JSON.stringify(subs, null, 2));
}

inspectPavithra();
