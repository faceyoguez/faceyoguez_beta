require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
    const { data: bData, error: bError } = await supabase.from('broadcasts').select('*').limit(1);
    console.log('Broadcasts:', JSON.stringify({ data: bData, error: bError }, null, 2));

    const { data: nData, error: nError } = await supabase.from('notifications').select('*').limit(1);
    console.log('Notifications:', JSON.stringify({ data: nData, error: nError }, null, 2));
}
test();
