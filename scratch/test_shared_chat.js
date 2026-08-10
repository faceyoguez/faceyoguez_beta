const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: convs, error } = await supabase
    .from('conversations')
    .select('*, conversation_participants(*, profile:profiles!user_id(full_name, role, email))');

  console.log("All Conversations:", JSON.stringify(convs, null, 2), error);
}

main();
