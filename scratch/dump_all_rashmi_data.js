const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const ids = [
    "12051866-1727-4e10-8b68-9e3f81729fdc", 
    "62ba293b-6ade-4ca1-9ffc-54ff4ac89e39",
    "0584c8e7-b6cb-4c94-b2ee-c4965a1c75d2"
  ];
  const queryStrings = ["rashmi", "rashu151094", "rashmi151094", "8368372223", "RASHMIJAIN100"];

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
    'conversion_events',
    'lms_courses',
    'lms_modules',
    'lms_lessons',
    'lms_enrollments',
    'lms_user_progress',
    'lms_progress',
    'face_photos',
    'photo_uploads',
    'user_assessments',
    'routines',
    'user_routines',
    'routine_plans',
    'notes',
    'user_notes'
  ];

  console.log("=== SCANNING TABLES FOR RASHMI JAIN ===");

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error || !data) continue;

      const matches = data.filter(row => {
        const str = JSON.stringify(row).toLowerCase();
        return ids.some(id => str.includes(id)) || queryStrings.some(q => str.includes(q.toLowerCase()));
      });

      if (matches.length > 0) {
        console.log(`\n>>> MATCHES IN TABLE: [${table}] (${matches.length} rows) <<<`);
        console.log(JSON.stringify(matches, null, 2));
      }
    } catch (e) {
      // ignore
    }
  }
}

main().catch(console.error);
