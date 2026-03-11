const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && key.trim()) acc[key.trim()] = val.join('=').trim().replace(/^\"|\"$/g, '');
    return acc;
}, {});

const supabaseAdmin = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

(async () => {
    console.log("--- E2E STUDENT INSERT TEST ---");

    // 1. Get an active batch
    const { data: batch } = await supabaseAdmin.from('batches').select('id, is_chat_enabled').limit(1).single();
    if (!batch) return console.log("No batches found.");
    console.log("Target Batch:", batch.id, "Chat Enabled:", batch.is_chat_enabled);

    // 2. Create a temporary student to test exact JWT context RLS
    const testEmail = "test_e2e_" + Date.now() + "@test.com";
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: 'password123',
        email_confirm: true
    });

    if (authErr) return console.log("Auth Error:", authErr);
    const tempUserId = authData.user.id;

    try {
        // Setup their profile & enrollment
        await supabaseAdmin.from('profiles').insert({ id: tempUserId, full_name: "E2E Tester", email: testEmail, role: 'student' });
        const { data: subData } = await supabaseAdmin.from('subscriptions').insert({
            student_id: tempUserId, plan_type: 'group_session', status: 'active', duration_months: 1, auto_renew: true
        }).select().single();
        await supabaseAdmin.from('batch_enrollments').insert({
            batch_id: batch.id, student_id: tempUserId, subscription_id: subData.id, status: 'active'
        });

        console.log("Test Student enrolled successfully.");

        // 3. Login as the student using the ANON client (triggers RLS)
        const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);
        await supabase.auth.signInWithPassword({ email: testEmail, password: 'password123' });

        console.log("Logged in. Attempting to insert message...");
        const { data: insertData, error: insertErr } = await supabase.from('batch_messages').insert({
            batch_id: batch.id,
            sender_id: tempUserId,
            content: 'E2E Test Message',
            content_type: 'text'
        }).select();

        if (insertErr) {
            console.error("\n❌ RLS INSERT FAILED:", JSON.stringify(insertErr, null, 2));
        } else {
            console.log("\n✅ RLS INSERT SUCCEEDED:", insertData);
        }

    } finally {
        // Cleanup
        await supabaseAdmin.auth.admin.deleteUser(tempUserId);
        console.log("--- CLEANUP DONE ---");
    }
})();
