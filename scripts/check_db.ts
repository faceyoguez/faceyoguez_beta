import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkDB() {
    console.log("Fetching batches...");
    const { data: batches, error: batchError } = await supabase.from('batches').select('*, batch_enrollments!inner(student_id)').order('created_at', { ascending: false }).limit(5);
    console.log("Batches Result:", JSON.stringify({ batches, batchError }, null, 2));

    console.log("Fetching user profiles to see if they are students...");
    const { data: profiles, error: profError } = await supabase.from('profiles').select('id, full_name, role').limit(5);
    console.log("Profiles Result:", JSON.stringify({ profiles, profError }, null, 2));
}

checkDB();
