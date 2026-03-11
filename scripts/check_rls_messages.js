const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
// Initialize with SERVICE ROLE KEY to bypass RLS
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    console.log('--- BATCh MESSAGES FETCH START ---');
    const { data: msgs, error } = await supabase
        .from('batch_messages')
        .select(`
            *,
            sender:profiles(id, full_name, avatar_url, role)
        `)
        .eq('batch_id', 'b78c3adf-85e9-4e74-a309-57d84db49255');
    console.log(JSON.stringify({ msgs, error }, null, 2));
    console.log('--- BATCh MESSAGES FETCH END ---');
})();
