const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findBlockedStudents() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`Checking for students with active subscriptions but expired batch enrollments as of ${today}...`);

  // 1. Get all active group subscriptions with end_date >= today
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('id, student_id, plan_type, start_date, end_date, created_at, student:profiles!student_id(full_name, email)')
    .eq('status', 'active')
    .eq('plan_type', 'group_session')
    .gte('end_date', today);

  console.log(`Found ${activeSubs?.length || 0} active group subscriptions valid today.`);

  for (const sub of activeSubs || []) {
    const student = sub.student;
    // Check batch enrollments for this student
    const { data: enrollments } = await supabase
      .from('batch_enrollments')
      .select('*')
      .eq('student_id', sub.student_id);

    const hasValidEnrollment = enrollments?.some(e => !e.effective_end_date || e.effective_end_date >= today);

    if (!hasValidEnrollment) {
      console.log(`\n⚠️  BLOCKED STUDENT DETECTED:`);
      console.log(`Student: ${student?.full_name} (${student?.email}) [ID: ${sub.student_id}]`);
      console.log(`Active Subscription: ${sub.id} (Start: ${sub.start_date}, End: ${sub.end_date})`);
      console.log(`Batch Enrollments:`, enrollments);
    }
  }
}

findBlockedStudents().catch(console.error);
