const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkZeroAmounts() {
  const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'student');
  const { data: subs } = await supabase.from('subscriptions').select('*');

  console.log(`Total students: ${profiles.length}`);
  console.log(`Total subscriptions: ${subs.length}`);

  const studentsWithSubs = [];
  for (const p of profiles) {
    const pSubs = subs.filter(s => s.student_id === p.id);
    if (pSubs.length > 0) {
      const paidSubs = pSubs.filter(s => !s.is_trial);
      const totalAmount = paidSubs.reduce((sum, s) => sum + (s.amount || 0), 0);
      
      studentsWithSubs.push({
        name: p.full_name,
        email: p.email,
        totalAmount,
        subsCount: pSubs.length,
        paidSubsCount: paidSubs.length,
        subsDetails: pSubs.map(s => ({ plan_type: s.plan_type, amount: s.amount, status: s.status, is_trial: s.is_trial }))
      });
    }
  }

  console.log(`\nStudents with subscriptions: ${studentsWithSubs.length}`);
  
  const zeroPaid = studentsWithSubs.filter(s => s.totalAmount === 0);
  console.log(`Students with subscriptions but totalPaid is 0: ${zeroPaid.length}`);
  console.log("Sample details of students with subscriptions but 0 amount:");
  console.log(JSON.stringify(zeroPaid.slice(0, 15), null, 2));
}

checkZeroAmounts();
