require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  const userId = '57358b57-2161-4eda-99fb-c3e11d3cd776';
  
  console.log('1. Checking profile...');
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (profileErr) {
    console.error('Error fetching profile:', profileErr);
  } else {
    console.log('Profile found:', profile);
  }

  console.log('\n2. Checking existing subscriptions...');
  const { data: subs, error: subsErr } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('student_id', userId);
    
  if (subsErr) {
    console.error('Error fetching subscriptions:', subsErr);
  } else {
    console.log('Subscriptions found:', subs);
  }

  console.log('\n3. Checking queue / enrollments...');
  const { data: enrolls, error: enrollsErr } = await supabase
    .from('enrolls') // Let's check if the table name is correct or if it's batch_enrollments
    .select('*')
    .eq('student_id', userId);
    
  if (enrollsErr) {
    // Let's also check batch_enrollments just in case
    const { data: batchEnrolls, error: batchEnrollsErr } = await supabase
      .from('batch_enrollments')
      .select('*')
      .eq('student_id', userId);
    if (batchEnrollsErr) {
      console.error('Error fetching batch_enrollments:', batchEnrollsErr);
    } else {
      console.log('batch_enrollments found:', batchEnrolls);
    }
  } else {
    console.log('Enrolls found:', enrolls);
  }
}

checkUser();
