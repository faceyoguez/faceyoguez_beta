const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Querying all auth users in pages...');
  
  let allUsers = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 100
    });

    if (error) {
      console.error('Error fetching page', page, error);
      break;
    }

    if (!users || users.length === 0) {
      hasMore = false;
      break;
    }

    allUsers = allUsers.concat(users);
    console.log(`Page ${page}: Fetched ${users.length} users. Total so far: ${allUsers.length}`);
    
    if (users.length < 100) {
      hasMore = false;
    } else {
      page++;
    }
  }

  console.log(`Finished fetching. Total auth users: ${allUsers.length}`);

  const targetDigits = '82535923';
  const targetSub = '8253';

  console.log('Searching for target phone in all auth users...');
  
  allUsers.forEach((user, index) => {
    const phone = String(user.phone || '');
    const metaPhone = String(user.user_metadata?.phone || user.user_metadata?.phone_number || '');
    const email = user.email || '';
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    const cleanMetaPhone = metaPhone.replace(/[\s\-\+\(\)]/g, '');

    const isMatch = cleanPhone.includes(targetDigits) || cleanMetaPhone.includes(targetDigits) ||
                    cleanPhone.includes(targetSub) || cleanMetaPhone.includes(targetSub);

    if (isMatch) {
      console.log(`MATCH FOUND: ID: ${user.id} | Email: ${email} | Phone: ${phone} | MetaPhone: ${metaPhone} | Created: ${user.created_at}`);
    }
  });

  // Let's also check for a user whose ID might map to a profile with no phone but we want to be sure
  // We can write all user emails/phones/metadata to a file
  const fs = require('fs');
  const userSummary = allUsers.map(u => ({
    id: u.id,
    email: u.email,
    phone: u.phone,
    metaPhone: u.user_metadata?.phone || u.user_metadata?.phone_number,
    name: u.user_metadata?.full_name,
    created_at: u.created_at
  }));
  fs.writeFileSync('scratch/all_auth_users.json', JSON.stringify(userSummary, null, 2));
  console.log('Saved all users to scratch/all_auth_users.json');
}

main();
