const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const hostId = '8bf040f2-bf86-40f4-a74b-dcbaec28e408'; // from previous run
  const studentId = 'fc44c167-8e34-499f-b2db-c69d7300255c'; // Aparna

  // 1. Check current resource count
  const { data: resBefore } = await supabase
    .from('student_resources')
    .select('id')
    .eq('student_id', studentId);
  console.log("Resources before:", resBefore.length);

  // 2. Insert test meeting
  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({
      host_id: hostId,
      student_id: studentId,
      zoom_meeting_id: '123456789',
      topic: 'Test Trigger Meeting',
      start_time: new Date().toISOString(),
      duration_minutes: 45,
      join_url: 'https://zoom.us/j/123456789',
      start_url: 'https://zoom.us/s/123456789',
      meeting_type: 'one_on_one'
    })
    .select()
    .single();

  if (error) {
    console.error("Insert meeting error:", error);
    return;
  }
  console.log("Meeting inserted successfully");

  // 3. Check resources after
  const { data: resAfter } = await supabase
    .from('student_resources')
    .select('*')
    .eq('student_id', studentId);
  console.log("Resources after:", resAfter.length);
  console.log("Resources list:", resAfter);

  // 4. Cleanup test meeting and resource
  await supabase.from('meetings').delete().eq('id', meeting.id);
  if (resAfter.length > resBefore.length) {
    const newRes = resAfter.find(r => !resBefore.some(b => b.id === r.id));
    if (newRes) {
      await supabase.from('student_resources').delete().eq('id', newRes.id);
      console.log("Cleaned up trigger-created resource:", newRes.id);
    }
  }
}

run();
