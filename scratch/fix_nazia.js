const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixNazia() {
  const studentId = 'd973f5e9-4e4b-4e67-b273-2f87aaf9b96d';
  const paymentId = 'pay_T5XglIxCO5H07M';
  const orderId = 'order_T5Xga6nYvhfyFn';
  const batchId = 'dabb067d-c796-46eb-a437-cd05d5196a5c';

  console.log("Checking if subscription already exists for Nazia...");
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('payment_id', paymentId)
    .maybeSingle();

  if (existingSub) {
    console.log("Subscription already exists:", existingSub.id);
    return;
  }

  // Calculate start and end dates
  // Purchased at timestamp 1782320252 = 2026-06-24T11:37:32Z
  const startDate = '2026-06-24';
  
  // 3 months plan duration for group_session is 110 days (based on verify-payment code)
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 110);
  const endDate = end.toISOString().split('T')[0]; // should be '2026-10-12'

  console.log(`Creating subscription: Start=${startDate}, End=${endDate}, Status=active`);
  
  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      student_id: studentId,
      plan_type: 'group_session',
      plan_variant: '3_months',
      status: 'active',
      duration_months: 3,
      start_date: startDate,
      end_date: endDate,
      amount: 700,
      currency: 'INR',
      payment_id: paymentId,
      batches_remaining: 2, // 3 months total, 1 used for current batch
      batches_used: 1,
      metadata: {
        planVariant: '3_months',
        bumps: [],
        couponCode: 'LAUNCH80',
        couponDiscount: 80,
        razorpay_order_id: orderId,
        created_via: 'manual_fix',
        purchased_at: '2026-06-24T11:37:32.000Z'
      }
    })
    .select()
    .single();

  if (subError || !sub) {
    console.error("Error creating subscription:", subError);
    return;
  }

  console.log("Created subscription successfully:", sub.id);

  // Enroll in Testbatch 1
  console.log(`Enrolling Nazia in batch ${batchId}...`);
  const { data: enrollment, error: enrollError } = await supabase
    .from('batch_enrollments')
    .insert({
      batch_id: batchId,
      student_id: studentId,
      subscription_id: sub.id,
      status: 'active',
      is_trial_access: false,
      effective_end_date: endDate,
      is_extended: false
    })
    .select()
    .single();

  if (enrollError) {
    console.error("Error enrolling in batch:", enrollError);
  } else {
    console.log("Enrolled successfully in batch:", enrollment.id);
  }

  // Add to waiting queue as well (with status 'assigned')
  console.log("Adding to waiting queue...");
  const { data: queue, error: queueError } = await supabase
    .from('waiting_queue')
    .insert({
      student_id: studentId,
      subscription_id: sub.id,
      status: 'assigned',
      requested_at: new Date('2026-06-24T11:37:32.000Z').toISOString()
    })
    .select()
    .single();

  if (queueError) {
    console.error("Error adding to waiting queue:", queueError);
  } else {
    console.log("Added to waiting queue successfully:", queue.id);
  }

  // Increment batch student count
  console.log("Incrementing batch student count...");
  const { error: rpcError } = await supabase.rpc('increment_batch_count', { batch_id: batchId });
  if (rpcError) {
    console.error("Error incrementing batch count:", rpcError);
  } else {
    console.log("Incremented batch count successfully");
  }

  // Notify student
  console.log("Sending confirmation notification...");
  await supabase.from('notifications').insert({
    user_id: studentId,
    title: '🎉 Purchase Confirmed!',
    message: `Your 21-Day Group Transformation plan is now active. Payment ID: ${paymentId}`,
    type: 'purchase_confirmation',
    is_read: false,
  });

  console.log("All done!");
}

fixNazia();
