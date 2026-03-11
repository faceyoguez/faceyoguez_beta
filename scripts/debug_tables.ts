import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('URL:', supabaseUrl);
console.log('Key defined:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('--- Public Tables Check Start ---');
    try {
        const { data: profiles, error } = await supabase.from('profiles').select('id').limit(1);

        if (error) {
            console.log('Profiles check error:', error.message);
        } else {
            console.log('Profiles table visible. Count:', profiles?.length);
        }

        const { data: broadcasts, error: bError } = await supabase.from('broadcasts').select('id').limit(1);
        if (bError) {
            console.log('Broadcasts check error:', bError.message);
        } else {
            console.log('Broadcasts table visible.');
        }

    } catch (e: any) {
        console.log('Unexpected Exception:', e.message);
    }
    console.log('--- Public Tables Check End ---');
}

listTables();
