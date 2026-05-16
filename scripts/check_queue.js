require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSubs() {
  const { data: queue, error } = await supabase.from('waiting_queue').select('*').eq('status', 'waiting');
  for (const q of queue) {
     const { data: sub } = await supabase.from('subscriptions').select('*').eq('id', q.subscription_id).single();
     console.log('Sub for queue id', q.id, ':', sub);
  }
}

checkSubs();
