const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Listing all auth users to find phone number matches...');
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing auth users:', error);
    return;
  }

  console.log(`Total auth users found: ${users.length}`);

  const targetDigits = '82535923';
  
  users.forEach((user, index) => {
    const phone = String(user.phone || '');
    const metaPhone = String(user.user_metadata?.phone || user.user_metadata?.phone_number || '');
    const email = user.email || '';
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    const cleanMetaPhone = metaPhone.replace(/[\s\-\+\(\)]/g, '');
    
    const isMatch = cleanPhone.includes(targetDigits) || cleanMetaPhone.includes(targetDigits);
    
    // Print all users with phone numbers first
    if (user.phone || user.user_metadata?.phone || isMatch) {
      console.log(`User ${index + 1}: ID: ${user.id} | Email: ${email} | Phone: ${phone} | MetaPhone: ${metaPhone} | Created: ${user.created_at}`);
    }
  });

  // Let's search by name or other fields if user has specified 82535923 as metadata
  console.log('\nSearching auth users for broad overlap...');
  users.forEach((user) => {
    const userStr = JSON.stringify(user).toLowerCase();
    if (userStr.includes('82535923') || userStr.includes('82535') || userStr.includes('5923')) {
      console.log('Broad Match user:', user.email, user.phone, user.user_metadata);
    }
  });
}

main();
