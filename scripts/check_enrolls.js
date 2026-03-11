const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
    console.log("Checking Enrollments for Batch:", 'b78c3adf-85e9-4e74-a309-57d84db49255');

    const { data: enrolls, error } = await supabase
        .from('batch_enrollments')
        .select('*, profiles (id, full_name)')
        .eq('batch_id', 'b78c3adf-85e9-4e74-a309-57d84db49255');

    console.log("Enrollments:", JSON.stringify({ enrolls, error }, null, 2));

    const { data: queue } = await supabase.from('waiting_queue').select('*');
    console.log("Waitlist length:", queue ? queue.length : 0);
})();
