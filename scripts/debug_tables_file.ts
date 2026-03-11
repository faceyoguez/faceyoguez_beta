import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    let output = '--- Public Tables Check Start ---\n';
    try {
        const { data: profiles, error } = await supabase.from('profiles').select('id').limit(1);
        if (error) {
            output += 'Profiles check error: ' + error.message + '\n';
        } else {
            output += 'Profiles table visible. Count: ' + (profiles?.length || 0) + '\n';
        }

        const { data: broadcasts, error: bError } = await supabase.from('broadcasts').select('id').limit(1);
        if (bError) {
            output += 'Broadcasts check error: ' + bError.message + '\n';
        } else {
            output += 'Broadcasts table visible.\n';
        }

        const { data: notifications, error: nError } = await supabase.from('notifications').select('id').limit(1);
        if (nError) {
            output += 'Notifications check error: ' + nError.message + '\n';
        } else {
            output += 'Notifications table visible.\n';
        }

    } catch (e: any) {
        output += 'Unexpected Exception: ' + e.message + '\n';
    }
    output += '--- Public Tables Check End ---\n';
    fs.writeFileSync('scripts/db_check_results.txt', output);
    console.log('Results written to scripts/db_check_results.txt');
}

listTables();
