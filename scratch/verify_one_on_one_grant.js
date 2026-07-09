const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: profile } = await supabase.from('profiles').select('id, full_name, email').eq('email', 'joellsiby@gmail.com').maybeSingle();
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, plan_type, plan_variant, status, start_date, end_date, duration_months')
    .eq('student_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('Profile:', profile);
  console.log('Recent subscriptions:', JSON.stringify(subs, null, 2));
}
main().then(() => process.exit(0));
