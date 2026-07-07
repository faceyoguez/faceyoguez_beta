const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/Onestone/faceyoguez/faceyoguez_beta/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // Try inserting a dummy message with content_type: 'deleted'
  // Or just try updating an existing message's content_type to 'deleted' and then changing it back.
  const { data: messages, error: fetchError } = await supabase.from('chat_messages').select('id, content_type').limit(1);
  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }
  if (!messages || messages.length === 0) {
    console.log('No chat messages found to test with.');
    return;
  }
  const original = messages[0];
  console.log('Original message:', original);
  
  const { data: updated, error: updateError } = await supabase
    .from('chat_messages')
    .update({ content_type: 'deleted' })
    .eq('id', original.id)
    .select();
    
  if (updateError) {
    console.error('Update error (indicating database constraint):', updateError);
  } else {
    console.log('Successfully updated content_type to "deleted"!');
    // Change it back
    await supabase
      .from('chat_messages')
      .update({ content_type: original.content_type })
      .eq('id', original.id);
    console.log('Reverted message content_type.');
  }
}
main();
