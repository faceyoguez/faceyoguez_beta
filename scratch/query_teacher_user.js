const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load env from Teacher project
const envConfig = dotenv.parse(fs.readFileSync('/Applications/Onestone/Teacher project/.env.local'));
const supabase = createClient(
  envConfig.NEXT_PUBLIC_SUPABASE_URL,
  envConfig.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Querying Teacher project auth users...');
  
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing auth users in Teacher project:', authError);
    return;
  }

  console.log(`Total auth users in Teacher project: ${users.length}`);

  const targetDigits = '82535923';
  const targetSub = '8253';

  users.forEach(user => {
    const phone = String(user.phone || '');
    const metaPhone = String(user.user_metadata?.phone || user.user_metadata?.phone_number || '');
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    const cleanMetaPhone = metaPhone.replace(/[\s\-\+\(\)]/g, '');
    if (cleanPhone.includes(targetDigits) || cleanMetaPhone.includes(targetDigits) || cleanPhone.includes(targetSub) || cleanMetaPhone.includes(targetSub)) {
      console.log('Match auth user in Teacher project:', user.email, user.phone, user.user_metadata);
    }
  });
}

main();
