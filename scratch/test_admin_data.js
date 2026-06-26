const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminData() {
  const [profilesRes, subsRes, queueRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
    supabase.from('waiting_queue').select('student_id, status').eq('status', 'waiting')
  ]);

  const profiles = profilesRes.data || [];
  const subscriptions = subsRes.data || [];
  const queueEntries = queueRes.data || [];

  const today = new Date().toISOString().split('T')[0];
  const queueSet = new Set(queueEntries.map((q) => q.student_id));

  const PLAN_PRIORITY = {
    lms: 4,
    group_session: 3,
    one_on_one: 2,
  };
  const getPlanPriority = (planType) => PLAN_PRIORITY[planType] ?? 1;

  const students = profiles.map((profile) => {
    const userSubs = subscriptions.filter((s) => s.student_id === profile.id);
    const activeSubs = userSubs.filter((s) => s.status === 'active' && s.end_date && s.end_date >= today);
    const activeSub = activeSubs.sort((a, b) => getPlanPriority(b.plan_type) - getPlanPriority(a.plan_type))[0] || null;
    const pendingSub = userSubs.find((s) => s.status === 'pending');
    const subWithEndDate = userSubs.find((s) => s.end_date != null);

    const paidSubs = userSubs.filter((s) => !s.is_trial);
    const isRenewed = paidSubs.length > 1;

    const latestSub = userSubs[0] || null;
    const couponUsed = latestSub?.metadata?.couponCode || null;
    const totalPaid = paidSubs.reduce((acc, s) => acc + (s.amount || 0), 0);

    return {
      name: profile.full_name,
      email: profile.email,
      amountPaid: totalPaid,
      status: activeSub ? 'active' : (queueSet.has(profile.id) || pendingSub ? 'queue' : 'inactive'),
      subsCount: userSubs.length,
      paidSubsCount: paidSubs.length
    };
  });

  console.log("Students sample:");
  console.log(students.slice(0, 20));
  
  const countWithAmount = students.filter(s => s.amountPaid > 0).length;
  console.log(`\nStudents with amountPaid > 0: ${countWithAmount} out of ${students.length}`);
}

testAdminData();
