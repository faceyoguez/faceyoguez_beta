const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && key.trim()) acc[key.trim()] = val.join('=').trim().replace(/^\"|\"$/g, '');
    return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

(async () => {
    const { data } = await supabase.from('batch_enrollments').select('*').limit(1);
    fs.writeFileSync('cols.json', JSON.stringify({ cols: data ? Object.keys(data[0]) : null }));
    console.log("Done");
})();
