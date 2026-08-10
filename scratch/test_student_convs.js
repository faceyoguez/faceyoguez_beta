const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: students } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'student').limit(5);
  console.log("Students:", students);

  for (const s of students || []) {
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('conversation_id, conversations(id, type)')
      .eq('user_id', s.id);
    
    console.log(`Conversations for ${s.full_name} (${s.email}):`, JSON.stringify(parts, null, 2));
  }
}

main();
