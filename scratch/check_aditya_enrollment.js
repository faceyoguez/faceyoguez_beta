require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const aditya2Id = 'a5ee1dd7-f449-40ec-a215-d63256ccea7e';
  
  const { data: enrollments, error: eError } = await supabase
    .from('batch_enrollments')
    .select(`
      *,
      subscription:subscriptions(*)
    `)
    .eq('student_id', aditya2Id)
    .eq('status', 'active');
    
  if (eError) return console.error('EError:', eError);
  
  console.log('Enrollments for Aditya2:', JSON.stringify(enrollments, null, 2));
}

main();
