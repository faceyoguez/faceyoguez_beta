require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase
        .from('batch_messages')
        .select(`
      *,
      sender:profiles(id, full_name, avatar_url, role)
    `)
        .limit(2);
    console.log(JSON.stringify(data, null, 2));
}
check();
