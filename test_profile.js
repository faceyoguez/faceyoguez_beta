require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
    const { data } = await supabase.from('profiles').select('*').limit(3);
    console.log(JSON.stringify(data, null, 2));
}
test();
