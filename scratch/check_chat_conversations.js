const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const ids = ["12051866-1727-4e10-8b68-9e3f81729fdc", "62ba293b-6ade-4ca1-9ffc-54ff4ac89e39"];

  console.log("=== CONVERSATION PARTICIPANTS ===");
  const { data: parts, error: pErr } = await supabase.from('conversation_participants').select('*, conversations(*)').in('user_id', ids);
  console.log("Participants:", parts, pErr);

  if (parts && parts.length > 0) {
    for (const part of parts) {
      const { data: msgs } = await supabase.from('chat_messages').select('*').eq('conversation_id', part.conversation_id).order('created_at', { ascending: true });
      console.log(`Messages in conversation ${part.conversation_id}:`, msgs);
    }
  }

  console.log("\n=== STUDENT RESOURCES ===");
  const { data: resources } = await supabase.from('student_resources').select('*').in('student_id', ids);
  console.log("Student resources:", resources);

  console.log("\n=== CHECKING ALL CHAT MESSAGES BY SENDER ===");
  const { data: sentMsgs } = await supabase.from('chat_messages').select('*').in('sender_id', ids);
  console.log("Sent messages:", sentMsgs);
}

main().catch(console.error);
