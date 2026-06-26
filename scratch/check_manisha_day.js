const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLAN_PRIORITY = { lms: 4, group_session: 3, one_on_one: 2 };
const getPlanPriority = (p) => PLAN_PRIORITY[p] ?? 1;

function differenceInDays(a, b) {
  return Math.floor((a - b) / (1000 * 60 * 60 * 24));
}

async function checkUser(emailOrName) {
  // Try by email first, then by name
  let { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .or(`email.ilike.%${emailOrName}%,full_name.ilike.%${emailOrName}%`)
    .eq('role', 'student');

  if (!profiles || profiles.length === 0) {
    console.log('No profile found for:', emailOrName);
    return;
  }

  for (const profile of profiles) {
    console.log('\n========================================');
    console.log(`Student: ${profile.full_name} (${profile.email})`);
    console.log(`ID: ${profile.id}`);

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });

    console.log(`\nAll subscriptions (${subs?.length ?? 0} total):`);
    (subs || []).forEach((s, i) => {
      console.log(`  [${i}] plan_type=${s.plan_type} | status=${s.status} | is_trial=${s.is_trial} | start=${s.start_date} | end=${s.end_date}`);
    });

    // ── Replicate NEW admin.ts logic ──
    const today = new Date().toISOString().split('T')[0];
    const activeSubs = (subs || []).filter(s => s.status === 'active' && s.end_date && s.end_date >= today);
    const activeSub = activeSubs.sort((a, b) => getPlanPriority(b.plan_type) - getPlanPriority(a.plan_type))[0] || null;
    const pendingSub = (subs || []).find(s => s.status === 'pending');
    const latestSub = subs?.[0] || null;
    const resolvedPlan = activeSub?.plan_type || pendingSub?.plan_type || latestSub?.plan_type || 'unsubscribed';

    console.log(`\n✅ RESOLVED PLAN (after fix): ${resolvedPlan}`);
    console.log(`   activeSub used: ${activeSub ? `plan_type=${activeSub.plan_type}, start=${activeSub.start_date}` : 'none'}`);

    // ── Replicate NEW dashboard journey day logic ──
    const todayStr = today;
    const activePaidSubs = (subs || []).filter(s => !s.is_trial && s.status === 'active' && (s.end_date === null || s.end_date >= todayStr));
    const activeAnySubs = (subs || []).filter(s => s.status === 'active' && (s.end_date === null || s.end_date >= todayStr));

    const journeySourceSub =
      activePaidSubs.length > 0
        ? activePaidSubs.reduce((earliest, s) =>
            !earliest || new Date(s.start_date) < new Date(earliest.start_date) ? s : earliest, null)
        : activeAnySubs.length > 0
        ? activeAnySubs[0]
        : subs?.length > 0
        ? subs[subs.length - 1]
        : null;

    const joinedDate = journeySourceSub?.start_date ? new Date(journeySourceSub.start_date) : null;
    const journeyDay = joinedDate ? Math.max(1, differenceInDays(new Date(), joinedDate) + 1) : 1;

    console.log(`\n📅 JOURNEY DAY (after fix): Day ${journeyDay}`);
    console.log(`   Source subscription: plan_type=${journeySourceSub?.plan_type}, start_date=${journeySourceSub?.start_date}`);

    // Show what OLD logic would have given
    const oldJoinedDate = subs?.length > 0 && subs[0].start_date ? new Date(subs[0].start_date) : null;
    const oldJourneyDay = oldJoinedDate ? Math.max(1, differenceInDays(new Date(), oldJoinedDate) + 1) : 1;
    console.log(`\n⚠️  OLD journey day (bug): Day ${oldJourneyDay}  (from: plan_type=${subs?.[0]?.plan_type}, start=${subs?.[0]?.start_date})`);
  }
}

async function main() {
  await checkUser('manisha');
  await checkUser('lavish');
  console.log('\n========================================\nDone.\n');
}

main().catch(console.error);
