const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEnrollmentIssue() {
  const studentId = '24964863-dce2-45b9-ab3e-a6fcb1924b91';
  const batchId = 'dabb067d-c796-46eb-a437-cd05d5196a5c';
  const newSubId = '419b4e27-f7d7-4bac-83c1-c68ceb82bec9';

  console.log('Testing insert of new batch_enrollment for subscription 2...');
  
  const { data, error } = await supabase.from('batch_enrollments').insert({
    batch_id: batchId,
    student_id: studentId,
    subscription_id: newSubId,
    status: 'active',
    is_trial_access: false,
    effective_end_date: '2026-09-28',
    is_extended: false,
  }).select();

  console.log('Insert Result:', { data, error });
}

checkEnrollmentIssue().catch(console.error);
