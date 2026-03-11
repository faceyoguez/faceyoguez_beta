const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && key.trim()) acc[key.trim()] = val.join('=').trim().replace(/^\"|\"$/g, '');
    return acc;
}, {});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

(async () => {
    console.log('--- TEST BATCH INSERT ---');

    // Test 1: Can we insert with Service Role (bypassing RLS entirely)?
    // We will use the explicit test student ID from earlier.
    const TEST_STUDENT_ID = "bca4fb53-ead9-432f-886b-1e7038bbc54f";
    const TEST_BATCH_ID = "b78c3adf-85e9-4e74-a309-57d84db49255";

    const { data: srData, error: srErr } = await supabase
        .from('batch_messages')
        .insert({
            batch_id: TEST_BATCH_ID,
            sender_id: TEST_STUDENT_ID,
            content: 'test from server script via service role',
            content_type: 'text'
        })
        .select();

    if (srErr) {
        console.error("SERVICE ROLE INSERT FAILED! This means it's a CONSTRAINTS error, NOT an RLS error:", srErr);
    } else {
        console.log("SERVICE ROLE INSERT SUCCESSFUL! This means the DB schema is perfect, but RLS is blocking the student.");
    }

    // Cleanup if successful
    if (srData) {
        await supabase.from('batch_messages').delete().eq('id', srData[0].id);
    }

    console.log('--- TEST END ---');
})();
