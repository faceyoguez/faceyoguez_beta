import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkMeetings() {
  const { data, error } = await supabase
    .from('meetings')
    .select('id, meeting_type, start_time, duration_minutes, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) console.error(error);
  else console.table(data);
}
checkMeetings();
