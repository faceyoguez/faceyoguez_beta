const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("=== RECENT CONVERSATIONS ===");
  const { data: convs } = await supabase
    .from('conversations')
    .select('*, conversation_participants(*, profiles(*))')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log(JSON.stringify(convs, null, 2));

  console.log("\n=== RECENT CHAT MESSAGES ===");
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*, sender:profiles(*)')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log(JSON.stringify(messages, null, 2));
}

main();
