const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: subs, error: subError } = await supabase
    .from('subscriptions')
    .select('*');

  if (subError) {
    console.error('Error fetching subscriptions:', subError);
    return;
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*');

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  const profileMap = {};
  profiles.forEach(p => {
    profileMap[p.id] = p;
  });

  console.log('--- ALL SUBSCRIPTIONS WITH STUDENT INFO ---');
  const details = subs.map(s => {
    const p = profileMap[s.student_id] || {};
    return {
      name: p.full_name,
      email: p.email,
      phone: p.phone,
      plan_type: s.plan_type,
      status: s.status,
      created_at: s.created_at,
      start_date: s.start_date,
      end_date: s.end_date,
      is_trial: s.is_trial
    };
  });

  // Sort by created_at descending
  details.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  details.forEach((d, idx) => {
    console.log(`${idx + 1}. Name: ${d.name} | Phone: ${d.phone} | Email: ${d.email} | Plan: ${d.plan_type} | Status: ${d.status} | Joined: ${d.created_at?.split('T')[0]} | Start: ${d.start_date}`);
  });
}

main();
