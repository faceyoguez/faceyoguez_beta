const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectRazorpayLog() {
  console.log("Checking if there are any webhook logs or other tables in supabase...");
  const { data: webhooks, error: wErr } = await supabase
    .from('subscriptions')
    .select('metadata')
    .limit(100);

  // Let's print unique emails/names in recent subscriptions metadata to see if Nazia is there under another name/email
  const uniqueMetadataNames = new Set();
  const uniqueMetadataEmails = new Set();
  
  for (const item of webhooks || []) {
    if (item.metadata) {
      if (item.metadata.name) uniqueMetadataNames.add(item.metadata.name);
      if (item.metadata.email) uniqueMetadataEmails.add(item.metadata.email);
    }
  }

  console.log("Names in metadata:", Array.from(uniqueMetadataNames));
  console.log("Emails in metadata:", Array.from(uniqueMetadataEmails));
}

inspectRazorpayLog();
