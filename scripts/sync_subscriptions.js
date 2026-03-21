const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncSubscriptions() {
    console.log('--- SYNC START ---');

    // 1. Get all active group session subscriptions
    const { data: activeSubs, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('plan_type', 'group_session')
        .eq('status', 'active');

    if (subError) {
        console.error('Error fetching subscriptions:', subError);
        return;
    }

    console.log(`Found ${activeSubs.length} active group session subscriptions.`);

    for (const sub of activeSubs) {
        // 2. Check if student is in waiting_queue
        const { data: queueEntry } = await supabase
            .from('waiting_queue')
            .select('id')
            .eq('student_id', sub.student_id)
            .eq('subscription_id', sub.id)
            .maybeSingle();

        // 3. Check if student is in batch_enrollments
        const { data: enrollment } = await supabase
            .from('batch_enrollments')
            .select('id')
            .eq('student_id', sub.student_id)
            .eq('subscription_id', sub.id)
            .maybeSingle();

        if (!queueEntry && !enrollment) {
            console.log(`Student ${sub.student_id} (Sub: ${sub.id}) is missing from queue and enrollments. Adding to waiting_queue...`);
            
            const { error: queueError } = await supabase
                .from('waiting_queue')
                .insert({
                    student_id: sub.student_id,
                    subscription_id: sub.id,
                    status: 'waiting'
                });

            if (queueError) {
                console.error(`Failed to add student ${sub.student_id} to queue:`, queueError);
            } else {
                console.log(`Successfully added student ${sub.student_id} to waiting_queue.`);
            }
        } else {
            console.log(`Student ${sub.student_id} (Sub: ${sub.id}) is already queued or enrolled.`);
        }
    }

    // 4. Update batch student counts
    console.log('--- RE-SYNCING BATCH COUNTS ---');
    const { data: batches } = await supabase.from('batches').select('id, name');
    
    if (batches) {
        for (const batch of batches) {
            const { count, error: countError } = await supabase
                .from('batch_enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('batch_id', batch.id);
            
            if (countError) {
                console.error(`Error counting enrollments for batch ${batch.name}:`, countError);
                continue;
            }

            console.log(`Batch ${batch.name}: Actual enrollments = ${count}`);
            
            const { error: updateError } = await supabase
                .from('batches')
                .update({ current_students: count || 0 })
                .eq('id', batch.id);

            if (updateError) {
                console.error(`Failed to update count for batch ${batch.name}:`, updateError);
            }
        }
    }

    console.log('--- SYNC COMPLETE ---');
}

syncSubscriptions().catch(console.error);
