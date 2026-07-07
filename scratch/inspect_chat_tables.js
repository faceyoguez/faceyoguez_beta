const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/Onestone/faceyoguez/faceyoguez_beta/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data: cols, error } = await supabase.rpc('get_layout_data'); // or just select from some table or run SQL via a query. Wait, let's see if we can just query chat_messages.
  // Wait, let's query information_schema or just fetch one row of chat_messages and batch_messages and print their keys.
  const { data: msg1 } = await supabase.from('chat_messages').select('*').limit(1);
  const { data: msg2 } = await supabase.from('batch_messages').select('*').limit(1);
  
  console.log('chat_messages keys:', msg1 ? Object.keys(msg1[0] || {}) : 'no rows');
  console.log('batch_messages keys:', msg2 ? Object.keys(msg2[0] || {}) : 'no rows');
}
main();
