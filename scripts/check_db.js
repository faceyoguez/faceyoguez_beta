const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
    console.log("Checking Queue...");
    const { data: queue } = await supabase.from('waiting_queue').select('*');
    console.log("Queue size:", queue ? queue.length : 0);

    console.log("Checking Enrollments...");
    const { data: enrolls } = await supabase.from('batch_enrollments').select('*');
    console.log("Total Enrollments:", enrolls ? enrolls.length : 0);

    console.log("Checking Batches...");
    const { data: batches } = await supabase.from('batches').select('name, current_students, status');
    console.log("Batches:", JSON.stringify(batches, null, 2));
})();
