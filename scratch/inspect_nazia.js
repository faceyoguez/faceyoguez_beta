const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectNazia() {
  console.log("Searching profiles for 'Nazia'...");
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Nazia%');
    
  if (pError) {
    console.error("Profile error:", pError);
    return;
  }
  
  console.log("Profiles found:", JSON.stringify(profiles, null, 2));
  
  if (!profiles || profiles.length === 0) {
    console.log("No profiles matching 'Nazia' found.");
    return;
  }
  
  for (const profile of profiles) {
    console.log(`\n========================================`);
    console.log(`User: ${profile.full_name} (${profile.email})`);
    console.log(`ID: ${profile.id}`);
    
    // Fetch subscriptions
    const { data: subs, error: sError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', profile.id);
      
    if (sError) {
      console.error("Sub error:", sError);
    } else {
      console.log("Subscriptions:", JSON.stringify(subs, null, 2));
    }
    
    // Fetch batch enrollments
    const { data: enrollments, error: eError } = await supabase
      .from('batch_enrollments')
      .select('*')
      .eq('student_id', profile.id);
      
    if (eError) {
      console.error("Enrollment error:", eError);
    } else {
      console.log("Batch Enrollments:", JSON.stringify(enrollments, null, 2));
    }
  }
}

inspectNazia();
