const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
    const { data, error } = await supabase.from('batches').select('*, batch_enrollments!inner ( student_id, profiles (id, full_name, avatar_url) )').limit(1);
    console.log('---OUTPUT---');
    console.log(JSON.stringify({ data, error }, null, 2));
})();
