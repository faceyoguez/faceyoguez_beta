const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, created_at');

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  // Filter profiles with non-null phone
  const profilesWithPhone = profiles.filter(p => p.phone);
  console.log(`Profiles with non-null phone: ${profilesWithPhone.length}`);

  // Sort them by phone number
  profilesWithPhone.sort((a, b) => String(a.phone).localeCompare(String(b.phone)));

  // Write all to console
  profilesWithPhone.forEach((p, index) => {
    console.log(`${index + 1}. Name: ${p.full_name} | Phone: ${p.phone} | Email: ${p.email}`);
  });
}

main();
