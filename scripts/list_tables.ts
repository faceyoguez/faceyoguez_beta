import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('--- Public Tables ---');

    // Using a SQL query via rpc if available, or just a known table
    const { data: profiles, error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
        console.log('Profiles check failed:', error.message);
    } else {
        console.log('Profiles table visible.');
    }
}

listTables();
