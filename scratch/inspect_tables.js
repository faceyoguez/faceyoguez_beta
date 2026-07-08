const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUser(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_master_instructor')
    .eq('email', email)
    .maybeSingle();

  if (error) { console.error('Error:', error.message); return; }
  if (!data) { console.log(`No user found with email: ${email}`); return; }

  console.log('\n=== User Profile ===');
  console.log(`Name:                 ${data.full_name}`);
  console.log(`Email:                ${data.email}`);
  console.log(`Role:                 ${data.role}`);
  console.log(`Is Master Instructor: ${data.is_master_instructor}`);
  console.log(`ID:                   ${data.id}`);
}

checkUser('harsimrat@test.com');
