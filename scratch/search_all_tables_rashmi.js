const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const ids = ["12051866-1727-4e10-8b68-9e3f81729fdc", "62ba293b-6ade-4ca1-9ffc-54ff4ac89e39"];

  // Let's check tables from scratch/inspect_tables.js or query tables directly
  const tableList = [
    'subscriptions',
    'batch_enrollments',
    'one_on_one_assignments',
    'one_on_one_schedules',
    'one_on_one_calls',
    'routine_assignments',
    'student_routines',
    'routines',
    'custom_routines',
    'student_notes',
    'notes',
    'consultation_bookings',
    'consultation_notes',
    'user_progress',
    'student_progress',
    'chats',
    'messages',
    'user_metadata'
  ];

  for (const t of tableList) {
    try {
      const { data, error } = await supabase.from(t).select('*').in('student_id', ids);
      if (!error && data && data.length > 0) {
        console.log(`Found data in table '${t}':`, data);
      } else if (error) {
        // try user_id
        const { data: d2, error: e2 } = await supabase.from(t).select('*').in('user_id', ids);
        if (!e2 && d2 && d2.length > 0) {
          console.log(`Found data in table '${t}' (user_id):`, d2);
        }
      }
    } catch (e) {
      // ignore table not found
    }
  }
}

main().catch(console.error);
