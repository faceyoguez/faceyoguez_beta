const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
    const { data, error } = await supabase.from('app_settings').select('*');
    console.log('---OUTPUT---');
    console.log(JSON.stringify({ data, error }, null, 2));
})();
