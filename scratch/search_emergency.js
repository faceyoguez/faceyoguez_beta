const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Searching all text/json fields in profiles and subscriptions...');
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*');

  if (pError) {
    console.error(pError);
    return;
  }

  const { data: subs, error: sError } = await supabase
    .from('subscriptions')
    .select('*');

  if (sError) {
    console.error(sError);
    return;
  }

  const target = '8253';
  const target2 = '5923';

  profiles.forEach(p => {
    const str = JSON.stringify(p).toLowerCase();
    if (str.includes(target) || str.includes(target2)) {
      console.log('Found match in profile:', p);
      // find subscriptions
      const userSubs = subs.filter(s => s.student_id === p.id);
      console.log('Subscriptions for this user:', userSubs);
    }
  });

  subs.forEach(s => {
    const str = JSON.stringify(s).toLowerCase();
    if (str.includes(target) || str.includes(target2)) {
      console.log('Found match in subscription:', s);
    }
  });
}

main();
