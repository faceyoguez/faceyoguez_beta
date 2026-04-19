require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('--- Courses ---');
  const { data: courses, error: courseError } = await supabase.from('lms_courses').select('*');
  if (courseError) console.error(courseError);
  console.log(JSON.stringify(courses, null, 2));

  console.log('\n--- Modules ---');
  const { data: modules, error: moduleError } = await supabase.from('lms_modules').select('*').limit(5);
  if (moduleError) console.error(moduleError);
  console.log(JSON.stringify(modules, null, 2));
}

main();
