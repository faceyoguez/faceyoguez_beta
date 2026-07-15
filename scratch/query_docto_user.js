const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load env from docto_beta
const envConfig = dotenv.parse(fs.readFileSync('/Applications/Onestone/docto beta/docto_beta/.env.local'));
const supabase = createClient(
  envConfig.NEXT_PUBLIC_SUPABASE_URL,
  envConfig.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Querying docto_beta patient_profiles...');
  
  const { data: patients, error: patientError } = await supabase
    .from('patient_profiles')
    .select('*');

  if (patientError) {
    console.error('Error fetching patient_profiles:', patientError);
    return;
  }

  console.log(`Total patient profiles found: ${patients.length}`);

  const targetDigits = '82535923';
  const targetSub = '8253';

  patients.forEach(p => {
    const phone = String(p.phone || p.phone_number || p.mobile || '');
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    const isMatch = cleanPhone.includes(targetDigits) || cleanPhone.includes(targetSub);
    if (isMatch) {
      console.log('Match patient profile:', p);
    }
  });

  // Let's also check auth.users in docto_beta
  console.log('Checking auth users in docto_beta...');
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing auth users in docto_beta:', authError);
  } else {
    console.log(`Total auth users: ${users.length}`);
    users.forEach(user => {
      const phone = String(user.phone || '');
      const metaPhone = String(user.user_metadata?.phone || user.user_metadata?.phone_number || '');
      const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
      const cleanMetaPhone = metaPhone.replace(/[\s\-\+\(\)]/g, '');
      if (cleanPhone.includes(targetDigits) || cleanMetaPhone.includes(targetDigits) || cleanPhone.includes(targetSub) || cleanMetaPhone.includes(targetSub)) {
        console.log('Match auth user:', user.email, user.phone, user.user_metadata);
      }
    });
  }
}

main();
