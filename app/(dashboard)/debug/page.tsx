import { createServerSupabaseClient } from '@/lib/supabase/server';

// TEMPORARY: presence/length-only check for Zoom env vars — never logs the actual
// secret values — to confirm whether Vercel is actually injecting them at runtime.
// Remove this block once the Vercel env var issue is confirmed fixed.
function envCheck(name: string) {
    const val = process.env[name];
    return { present: !!val, length: val ? val.length : 0 };
}

export default async function DebugPage() {
    const supabase = await createServerSupabaseClient();

    const zoomEnvStatus = {
        ZOOM_SDK_CLIENT_ID: envCheck('ZOOM_SDK_CLIENT_ID'),
        ZOOM_SDK_CLIENT_SECRET: envCheck('ZOOM_SDK_CLIENT_SECRET'),
        ZOOM_ACCOUNT_ID: envCheck('ZOOM_ACCOUNT_ID'),
        ZOOM_CLIENT_ID: envCheck('ZOOM_CLIENT_ID'),
        ZOOM_CLIENT_SECRET: envCheck('ZOOM_CLIENT_SECRET'),
        // Not a secret (just an email) — shown in full to confirm it's the right account.
        ZOOM_HOST_EMAIL: process.env.ZOOM_HOST_EMAIL || '(not set)',
    };

    // Names only (never values) of every env var Vercel actually injected that
    // contains "ZOOM" — reveals typos/renames invisible in the Vercel dashboard.
    const allZoomKeys = Object.keys(process.env)
        .filter((k) => k.toUpperCase().includes('ZOOM'))
        .sort()
        .map((k) => JSON.stringify(k)); // JSON.stringify surfaces stray whitespace

    const { data: batches, error: batchError } = await supabase
        .from('batches')
        .select('id, name, created_at, max_students, current_students, status, is_chat_enabled')
        .order('created_at', { ascending: false });

    const { data: enrolls, error: enrollError } = await supabase
        .from('batch_enrollments')
        .select('*, profiles (id, full_name)')
        .eq('batch_id', 'b78c3adf-85e9-4e74-a309-57d84db49255');

    const { data: queue, error: queueError } = await supabase
        .from('waiting_queue')
        .select('*');

    return (
        <div className="p-10 font-mono text-xs whitespace-pre-wrap">
            <h1 className="text-2xl font-bold mb-4">Database State</h1>

            <h2 className="text-xl font-bold mt-8">Zoom Env Vars (presence/length only, never the value)</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(zoomEnvStatus, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-8">All env var KEY NAMES containing "ZOOM" (names only, never values)</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(allZoomKeys, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-8">Batches</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({ batches, error: batchError }, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-8">Enrollments for testbatch1</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({ enrolls, error: enrollError }, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-8">Waitlist</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({ queue, error: queueError }, null, 2)}</pre>
        </div>
    );
}
