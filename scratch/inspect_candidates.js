const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const candidates = [
    { name: 'Ankita Chaurasiya', phone: '+918252149762', email: 'kumariank007@gmail.com' },
    { name: 'Namarta Jain', phone: '+918284905147', email: 'namartajn999@gmail.com' },
    { name: 'Kamal', phone: '+918264763645', email: 'frienkysudan@gmail.com' },
    { name: 'Rohini Patil', phone: '+919535749292', email: 'rohini2157rk@gmail.com' },
    { name: 'Karuna Shah', phone: '93234 38253', email: 'karuna.bshah@gmail.com' }
  ];

  for (const c of candidates) {
    console.log(`\n=== Candidate: ${c.name} ===`);
    console.log(`Phone: ${c.phone} | Email: ${c.email}`);
    
    // Find profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', c.email)
      .maybeSingle();

    if (profile) {
      console.log('Profile created_at:', profile.created_at);
      console.log('Role:', profile.role);
    } else {
      console.log('No profile in database.');
    }

    // Find subscriptions
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', profile ? profile.id : '00000000-0000-0000-0000-000000000000');

    if (subs && subs.length > 0) {
      console.log('Subscriptions found:');
      subs.forEach((s, idx) => {
        console.log(`  Sub ${idx+1}:`);
        console.log(`    Plan Type: ${s.plan_type}`);
        console.log(`    Status: ${s.status}`);
        console.log(`    Amount: ${s.amount} ${s.currency}`);
        console.log(`    Payment ID: ${s.payment_id}`);
        console.log(`    Created At (Joining Date): ${s.created_at}`);
        console.log(`    Start Date: ${s.start_date}`);
        console.log(`    End Date: ${s.end_date}`);
        console.log(`    Metadata:`, s.metadata);
      });
    } else {
      console.log('No subscriptions in database.');
    }
  }
}

main();
