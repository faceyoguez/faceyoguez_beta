const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findInactivePaidStudents() {
  const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'student');
  const { data: subs } = await supabase.from('subscriptions').select('*');
  const { data: queue } = await supabase.from('waiting_queue').select('student_id').eq('status', 'waiting');

  const queueSet = new Set(queue.map(q => q.student_id));
  const today = new Date().toISOString().split('T')[0];

  const PLAN_PRIORITY = { lms: 4, group_session: 3, one_on_one: 2 };
  const getPlanPriority = (planType) => PLAN_PRIORITY[planType] ?? 1;

  const inactivePaid = [];

  for (const p of profiles) {
    const userSubs = subs.filter(s => s.student_id === p.id);
    const activeSubs = userSubs.filter(s => s.status === 'active' && s.end_date && s.end_date >= today);
    const activeSub = activeSubs.sort((a, b) => getPlanPriority(b.plan_type) - getPlanPriority(a.plan_type))[0] || null;
    const pendingSub = userSubs.find(s => s.status === 'pending');

    const paidSubs = userSubs.filter(s => !s.is_trial);
    const totalPaid = paidSubs.reduce((sum, s) => sum + (s.amount || 0), 0);

    const calculatedStatus = activeSub ? 'active' : (queueSet.has(p.id) || pendingSub ? 'queue' : 'inactive');

    if (totalPaid > 0 && calculatedStatus === 'inactive') {
      inactivePaid.push({
        name: p.full_name,
        email: p.email,
        totalPaid,
        subs: userSubs.map(s => ({ plan_type: s.plan_type, status: s.status, end_date: s.end_date }))
      });
    }
  }

  console.log(`Paid but inactive students count: ${inactivePaid.length}`);
  console.log(JSON.stringify(inactivePaid, null, 2));
}

findInactivePaidStudents();
