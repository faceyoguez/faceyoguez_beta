import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Assuming this exists in .env.local

async function testWithAdmin() {
    console.log('Testing with Admin (Service Role)...');
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: subs, error } = await admin
        .from('subscriptions')
        .select(`
            id,
            plan_type,
            status,
            student_id,
            profiles:student_id (id, full_name)
        `)
        .eq('plan_type', 'one_on_one')
        .eq('status', 'active');

    console.log('Admin results:', { count: subs?.length, error: error?.message });
    if (subs && subs.length > 0) {
        console.log('First student profile:', subs[0].profiles);
    }
}

testWithAdmin();
