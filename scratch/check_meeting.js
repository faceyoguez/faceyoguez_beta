const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('email', 'joel1@123.com')
    .maybeSingle();

  if (!profile) { console.log('No profile found for joel1@123.com'); return; }
  console.log('Student:', profile);

  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('id, topic, host_id, student_id, meeting_type, start_time, created_at, zoom_meeting_id')
    .eq('student_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) { console.log('Query error:', error.message); return; }
  console.log(`Found ${meetings.length} meeting(s) for this student:`);
  console.log(JSON.stringify(meetings, null, 2));

  if (meetings.length > 0) {
    const hostIds = [...new Set(meetings.map(m => m.host_id))];
    const { data: hosts } = await supabase.from('profiles').select('id, full_name, email, role').in('id', hostIds);
    console.log('Hosts:', JSON.stringify(hosts, null, 2));
  }
}

main().then(() => process.exit(0));
