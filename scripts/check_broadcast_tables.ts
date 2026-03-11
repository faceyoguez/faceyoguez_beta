import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking for broadcast and notification tables...');

    const { data: bData, error: bError } = await supabase
        .from('broadcasts')
        .select('*')
        .limit(1);

    if (bError) {
        console.log('Error fetching broadcasts:', bError.message);
    } else {
        console.log('Broadcasts table found.');
    }

    const { data: nData, error: nError } = await supabase
        .from('notifications')
        .select('*')
        .limit(1);

    if (nError) {
        console.log('Error fetching notifications:', nError.message);
    } else {
        console.log('Notifications table found.');
    }
}

checkTables();
