const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSonuEnrollment() {
  const studentId = '24964863-dce2-45b9-ab3e-a6fcb1924b91';
  const newSubId = '419b4e27-f7d7-4bac-83c1-c68ceb82bec9';
  const newEndDate = '2026-09-28';

  console.log('Fixing enrollment for Sonu Meena (sonum2355@gmail.com)...');

  // Update existing batch enrollment for Testbatch 1
  const { data, error } = await supabase
    .from('batch_enrollments')
    .update({
      subscription_id: newSubId,
      effective_end_date: newEndDate,
      status: 'active',
      is_trial_access: false,
    })
    .eq('student_id', studentId)
    .select();

  if (error) {
    console.error('Failed to update batch enrollment:', error);
  } else {
    console.log('Successfully updated batch_enrollment:', data);
  }
}

fixSonuEnrollment().catch(console.error);
