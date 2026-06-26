const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const today = new Date().toISOString().split('T')[0];

  // Find all active one_on_one subscriptions
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      student_id,
      is_trial,
      start_date,
      end_date,
      status,
      profiles!student_id(full_name, email)
    `)
    .eq('plan_type', 'one_on_one')
    .eq('status', 'active');

  if (error) { console.error(error); return; }

  console.log(`Found ${subs.length} active one_on_one subscriptions\n`);
  
  for (const s of subs) {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    const startDate = s.start_date ? new Date(s.start_date) : null;
    const elapsedDays = startDate ? Math.floor((Date.now() - startDate.getTime()) / 86400000) + 1 : null;
    const isExpired = s.end_date && s.end_date < today;

    const flag = elapsedDays && elapsedDays > 30 ? '⚠️  >30 DAYS' : '';
    const expiredFlag = isExpired ? '🔴 END DATE PASSED' : '';

    console.log(`${flag || expiredFlag ? '❌' : '✅'} ${profile?.full_name || 'Unknown'} (${profile?.email})`);
    console.log(`   start=${s.start_date} | end=${s.end_date} | elapsed=${elapsedDays} days | is_trial=${s.is_trial} ${flag} ${expiredFlag}`);
  }
}

main().catch(console.error);
