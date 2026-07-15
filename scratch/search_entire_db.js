const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Searching entire Supabase database for "8253" or "5923"...');
  
  // Since we don't have direct sql execution client via supabase, let's search typical tables we know exist:
  const tables = [
    'profiles',
    'subscriptions',
    'batches',
    'batch_enrollments',
    'waiting_queue',
    'meetings',
    'journey_logs',
    'notifications',
    'coupons',
    'broadcasts',
    'consultations',
    'consultation_bookings',
    'conversations',
    'chat_messages',
    'app_settings',
    'conversion_events'
  ];

  const target = '8253';
  const target2 = '5923';

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        // Table might not exist, ignore
        continue;
      }
      
      let matchCount = 0;
      data.forEach(row => {
        const str = JSON.stringify(row).toLowerCase();
        if (str.includes(target) || str.includes(target2)) {
          console.log(`[MATCH] Table: ${table}`);
          console.log('Row:', row);
          matchCount++;
        }
      });
    } catch (e) {
      // Ignore errors
    }
  }
  
  console.log('Finished database-wide search.');
}

main();
