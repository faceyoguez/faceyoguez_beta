import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getZoomToken } from '@/lib/zoom';

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

    // TEMPORARY: presence/length-only check for SMTP env vars — same safe pattern
    // as the Zoom check above — to compare local vs Vercel-deployed credentials.
    const smtpEnvStatus = {
        SMTP_HOST: envCheck('SMTP_HOST'),
        SMTP_PORT: envCheck('SMTP_PORT'),
        SMTP_USER: envCheck('SMTP_USER'),
        SMTP_PASSWORD: envCheck('SMTP_PASSWORD'),
        EMAIL_FROM: envCheck('EMAIL_FROM'),
    };

    // Names only (never values) of every env var Vercel actually injected that
    // contains "ZOOM" — reveals typos/renames invisible in the Vercel dashboard.
    const allZoomKeys = Object.keys(process.env)
        .filter((k) => k.toUpperCase().includes('ZOOM'))
        .sort()
        .map((k) => JSON.stringify(k)); // JSON.stringify surfaces stray whitespace

    // TEMPORARY: checks whether specific known emails exist as Zoom users under
    // our Server-to-Server credentials' account — presence/count only, never the
    // actual user list, since this page has no admin gate (any logged-in role
    // can view it) and a full user dump would leak real emails/PII to students.
    const KNOWN_EMAILS_TO_CHECK = ['faceyoguezofficial@gmail.com', 'faceyoguezwebsitedevelopment@gmail.com'];
    let zoomUsersResult: any;
    try {
        const token = await getZoomToken();
        const res = await fetch('https://api.zoom.us/v2/users?status=active&page_size=100', {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const emails: string[] = (data.users || []).map((u: any) => (u.email || '').toLowerCase());
        zoomUsersResult = {
            ok: res.ok,
            status: res.status,
            total_records: data.total_records,
            presenceCheck: Object.fromEntries(
                KNOWN_EMAILS_TO_CHECK.map((e) => [e, emails.includes(e.toLowerCase())])
            ),
        };
    } catch (err: any) {
        zoomUsersResult = { error: err?.message || 'Failed to fetch Zoom users' };
    }

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

            <h2 className="text-xl font-bold mt-8">SMTP Env Vars (presence/length only, never the value)</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(smtpEnvStatus, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-8">All env var KEY NAMES containing "ZOOM" (names only, never values)</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(allZoomKeys, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-8">Do known emails exist as Zoom users under our S2S credentials' account? (presence/count only, no PII)</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(zoomUsersResult, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-8">Batches</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({ batches, error: batchError }, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-8">Enrollments for testbatch1</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({ enrolls, error: enrollError }, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-8">Waitlist</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({ queue, error: queueError }, null, 2)}</pre>
        </div>
    );
}
