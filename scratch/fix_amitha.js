const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAmitha() {
  // Find the batch_enrollment for Amitha (ucanreachamitha@gmail.com)
  const studentId = '98d42379-32a6-4d65-905f-36e148077d91'; // ucanreachamitha profile
  
  const { data: enrollment } = await supabase
    .from('batch_enrollments')
    .select('*, subscription:subscriptions!subscription_id(*)')
    .eq('student_id', studentId);
    
  console.log("Amitha enrollment:", JSON.stringify(enrollment, null, 2));
  
  // Set start_date on her subscription to today (her profile was created today)
  if (enrollment?.[0]?.subscription_id) {
    const startDate = '2026-06-26';
    const { error } = await supabase
      .from('subscriptions')
      .update({ start_date: startDate })
      .eq('id', enrollment[0].subscription_id);
    
    if (error) {
      console.error("Error updating:", error);
    } else {
      console.log(`Updated subscription ${enrollment[0].subscription_id} with start_date=${startDate}`);
    }
  }
}

fixAmitha();
