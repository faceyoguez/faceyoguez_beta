import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function DebugPage() {
    const supabase = await createServerSupabaseClient();

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

            <h2 className="text-xl font-bold mt-8">Batches</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({ batches, error: batchError }, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-8">Enrollments for testbatch1</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({ enrolls, error: enrollError }, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-8">Waitlist</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({ queue, error: queueError }, null, 2)}</pre>
        </div>
    );
}
