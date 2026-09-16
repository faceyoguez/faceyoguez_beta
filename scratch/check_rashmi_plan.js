const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const ids = ["12051866-1727-4e10-8b68-9e3f81729fdc", "62ba293b-6ade-4ca1-9ffc-54ff4ac89e39"];

  console.log("=== INSTRUCTOR LOOKUP ===");
  const { data: inst } = await supabase.from('profiles').select('*').eq('id', '8bf040f2-bf86-40f4-a74b-dcbaec28e408');
  console.log("Assigned Instructor:", inst);

  for (const id of ids) {
    console.log(`\n================ ID: ${id} ================`);
    
    // Check user journey / routine / plans
    const { data: journeyLogs } = await supabase.from('user_journey_logs').select('*').eq('student_id', id);
    console.log("Journey logs:", journeyLogs);

    const { data: consultations } = await supabase.from('consultations').select('*').eq('student_id', id);
    console.log("Consultations:", consultations);

    // Check one on one sessions
    const { data: oooSessions } = await supabase.from('one_on_one_sessions').select('*').eq('student_id', id);
    console.log("One-on-One Sessions:", oooSessions);

    // Check chats
    const { data: chatParticipants } = await supabase.from('chat_participants').select('*, chat_threads(*)').eq('user_id', id);
    console.log("Chat Threads:", chatParticipants);

    if (chatParticipants && chatParticipants.length > 0) {
      for (const p of chatParticipants) {
        const { data: msgs } = await supabase.from('chat_messages').select('*').eq('thread_id', p.thread_id).order('created_at', { ascending: true });
        console.log(`Messages in thread ${p.thread_id}:`, msgs);
      }
    }

    // Check face photos / uploads
    const { data: facePhotos } = await supabase.from('student_face_photos').select('*').eq('student_id', id);
    console.log("Face photos:", facePhotos);

    // Check lms progress
    const { data: lmsProgress } = await supabase.from('user_lms_progress').select('*').eq('user_id', id);
    console.log("LMS progress count:", lmsProgress ? lmsProgress.length : 0);
  }
}

main().catch(console.error);
