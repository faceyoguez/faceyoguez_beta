require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const windowStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  console.log("Using window:", windowStart);
  const { data, error } = await supabase
    .from('meetings')
    .select('*, host:profiles(full_name, avatar_url)')
    .eq('meeting_type', 'one_on_one')
    .gte('start_time', windowStart);
    
  console.log('Error:', error);
  console.log('Data count:', data ? data.length : null);
}
run();
