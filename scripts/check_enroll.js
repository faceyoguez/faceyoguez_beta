require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEnrollments() {
  const { data: enr, error } = await supabase.from('batch_enrollments').select('*').eq('student_id', '15a8fa4b-44c4-441e-9c60-5001235d860d');
  console.log('batch_enrollments:', enr);
}

checkEnrollments();
