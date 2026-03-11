import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log('Testing fetchActiveOneOnOneStudents query patterns...');

    // Pattern 1: Current code
    const { data: sub1, error: err1 } = await supabase
        .from('subscriptions')
        .select(`
            student_id,
            profiles:student_id (
                id,
                full_name,
                email,
                avatar_url
            )
        `)
        .eq('plan_type', 'one_on_one')
        .eq('status', 'active');

    console.log('Pattern 1 (current):', { count: sub1?.length, error: err1?.message });
    if (sub1 && sub1.length > 0) console.log('Sample 1:', sub1[0]);

    // Pattern 2: Standard table join
    const { data: sub2, error: err2 } = await supabase
        .from('subscriptions')
        .select(`
            student_id,
            profiles(
                id,
                full_name,
                email,
                avatar_url
            )
        `)
        .eq('plan_type', 'one_on_one')
        .eq('status', 'active');

    console.log('Pattern 2 (standard):', { count: sub2?.length, error: err2?.message });
    if (sub2 && sub2.length > 0) console.log('Sample 2:', sub2[0]);

    // Pattern 3: Using bang for disambiguation
    const { data: sub3, error: err3 } = await supabase
        .from('subscriptions')
        .select(`
            student_id,
            profiles!student_id(
                id,
                full_name,
                email,
                avatar_url
            )
        `)
        .eq('plan_type', 'one_on_one')
        .eq('status', 'active');

    console.log('Pattern 3 (!):', { count: sub3?.length, error: err3?.message });
}

testQuery();
