const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH_ID = 'dabb067d-c796-46eb-a437-cd05d5196a5c';

async function checkBatchEnrollments() {
  console.log(`Checking batch ${BATCH_ID}...`);
  
  const { data: batch } = await supabase
    .from('batches')
    .select('id, name, start_date, status')
    .eq('id', BATCH_ID)
    .single();
  
  console.log("Batch:", JSON.stringify(batch, null, 2));
  
  // First: list all columns in batch_enrollments by selecting everything
  const { data: enrollments, error: eErr } = await supabase
    .from('batch_enrollments')
    .select(`
      *,
      student:profiles!student_id(id, full_name, email, created_at),
      subscription:subscriptions!subscription_id(id, plan_type, status, start_date, end_date, amount)
    `)
    .eq('batch_id', BATCH_ID);
  
  if (eErr) { console.error("Error:", eErr); return; }
  
  console.log(`\nFound ${enrollments?.length} enrollments:`);
  for (const e of enrollments || []) {
    // Log all keys in the enrollment object to see what's available
    const enrollmentKeys = Object.keys(e).filter(k => k !== 'student' && k !== 'subscription');
    console.log(`\n- Student: ${e.student?.full_name} (${e.student?.email})`);
    console.log(`  Enrollment fields:`, enrollmentKeys.map(k => `${k}: ${e[k]}`).join(', '));
    console.log(`  subscription.start_date: ${e.subscription?.start_date}`);
    console.log(`  subscription.status: ${e.subscription?.status}`);
    
    const subStart = e.subscription?.start_date;
    const effectiveDate = subStart;
    const daysSince = effectiveDate 
      ? Math.max(0, Math.floor((Date.now() - new Date(effectiveDate).getTime()) / 86400000))
      : '(no date - falls back to batch start: 117 days)';
    
    console.log(`  → Days shown in UI: ${daysSince}`);
  }
}

checkBatchEnrollments();
