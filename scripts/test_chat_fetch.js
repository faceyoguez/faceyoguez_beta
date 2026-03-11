const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && key.trim()) acc[key.trim()] = val.join('=').trim().replace(/^\"|\"$/g, '');
    return acc;
}, {});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

(async () => {
    // 1. Get all enrollments
    const { data: enrolls } = await supabase.from('batch_enrollments').select('batch_id, student_id, status');

    // 2. Get all messages
    const { data: msgs } = await supabase.from('batch_messages').select('id, batch_id, sender_id, content');

    fs.writeFileSync('db_check.json', JSON.stringify({ enrolls, msgs }, null, 2));
    console.log("Wrote db_check.json");
})();
