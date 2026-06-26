const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// For all pending subscriptions in Testbatch 1 that have null start_date,
// set start_date to the student's profile created_at date (i.e., when they signed up/paid)
const BATCH_ID = 'dabb067d-c796-46eb-a437-cd05d5196a5c';

async function fixPendingSubscriptions() {
  // Get all enrollments with pending subscriptions (null start_date)
  const { data: enrollments, error } = await supabase
    .from('batch_enrollments')
    .select(`
      subscription_id,
      student:profiles!student_id(id, full_name, email, created_at),
      subscription:subscriptions!subscription_id(id, plan_type, status, start_date, amount, payment_id, duration_months)
    `)
    .eq('batch_id', BATCH_ID);

  if (error) { console.error("Error:", error); return; }

  console.log("Processing enrollments...");
  let updatedCount = 0;

  for (const e of enrollments || []) {
    const sub = e.subscription;
    if (!sub) continue;
    
    // Only fix subscriptions with null start_date and pending/no-status
    if (sub.start_date !== null) {
      console.log(`  ✓ ${e.student?.full_name}: already has start_date=${sub.start_date}, skip`);
      continue;
    }
    
    // Use student profile created_at as the start date proxy (when they joined/paid)
    const studentCreatedAt = e.student?.created_at;
    if (!studentCreatedAt) {
      console.log(`  ✗ ${e.student?.full_name}: no profile created_at, skipping`);
      continue;
    }
    
    const startDate = studentCreatedAt.split('T')[0]; // YYYY-MM-DD
    
    // Calculate end_date based on duration_months
    const endDate = (() => {
      const start = new Date(startDate);
      const months = sub.duration_months || 3;
      start.setMonth(start.getMonth() + months);
      return start.toISOString().split('T')[0];
    })();

    console.log(`  → Updating ${e.student?.full_name}: start_date=${startDate}, end_date=${endDate} (${sub.duration_months||3} months), keeping status=pending`);
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        start_date: startDate,
        // Only update end_date, NOT status (leave as pending until webhook confirms)
      })
      .eq('id', sub.id);
      
    if (updateError) {
      console.error(`  ERROR updating ${sub.id}:`, updateError);
    } else {
      console.log(`  ✓ Updated successfully`);
      updatedCount++;
    }
  }

  console.log(`\nDone! Updated ${updatedCount} subscriptions.`);
}

fixPendingSubscriptions();
