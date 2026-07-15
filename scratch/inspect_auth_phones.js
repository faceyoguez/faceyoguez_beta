const fs = require('fs');
const users = JSON.parse(fs.readFileSync('scratch/all_auth_users.json', 'utf8'));

console.log('Listing all auth users with phone or metaPhone...');
users.forEach(u => {
  if (u.phone || u.metaPhone) {
    console.log(`- Email: ${u.email} | Name: ${u.name} | Phone: ${u.phone} | MetaPhone: ${u.metaPhone} | Created: ${u.created_at}`);
  }
});
