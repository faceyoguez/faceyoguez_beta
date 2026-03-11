import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('--- Database Table Check ---');

    // Check broadcasts
    const { data: bData, error: bError } = await supabase.from('broadcasts').select('id').limit(1);
    if (bError) {
        console.log('Broadcasts table check failed:', bError.message);
    } else {
        console.log('Broadcasts table EXISTS.');
    }

    // Check notifications
    const { data: nData, error: nError } = await supabase.from('notifications').select('id').limit(1);
    if (nError) {
        console.log('Notifications table check failed:', nError.message);
    } else {
        console.log('Notifications table EXISTS.');
    }
}

checkTables();
