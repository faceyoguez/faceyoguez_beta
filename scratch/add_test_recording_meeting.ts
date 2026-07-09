// One-off script: inserts a test `meetings` row for Testbatch 1 pointing at a
// real Zoom meeting (878 0059 4825), dated July 9, so its recording shows up
// in the student-side Recordings UI for testing the new processing-state UI.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ZOOM_MEETING_ID = '87800594825';
const BATCH_NAME = 'Testbatch 1';
// July 9, 2026, 6:00 PM IST = 12:30 PM UTC
const START_TIME_UTC = '2026-07-09T12:30:00.000Z';
const DURATION_MINUTES = 60;

async function main() {
  const { data: batch, error: batchErr } = await supabase
    .from('batches')
    .select('id, name')
    .eq('name', BATCH_NAME)
    .single();

  if (batchErr || !batch) {
    throw new Error(`Could not find batch "${BATCH_NAME}": ${batchErr?.message}`);
  }
  console.log('Found batch:', batch.id, batch.name);

  // Reuse a real host_id from an existing meeting on this batch, if one exists.
  const { data: existingMeeting } = await supabase
    .from('meetings')
    .select('host_id')
    .eq('batch_id', batch.id)
    .eq('meeting_type', 'group_session')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let hostId = existingMeeting?.host_id as string | undefined;

  if (!hostId) {
    const { data: instructor } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'instructor')
      .limit(1)
      .maybeSingle();
    hostId = instructor?.id;
  }

  if (!hostId) {
    throw new Error('Could not find a host_id to use (no existing meeting on this batch, no instructor profile found).');
  }
  console.log('Using host_id:', hostId);

  const joinUrl = `https://zoom.us/j/${ZOOM_MEETING_ID}`;

  const { data: inserted, error: insertErr } = await supabase
    .from('meetings')
    .insert({
      host_id: hostId,
      batch_id: batch.id,
      student_id: null,
      zoom_meeting_id: ZOOM_MEETING_ID,
      topic: `${BATCH_NAME} — Test Recording Session`,
      start_time: START_TIME_UTC,
      duration_minutes: DURATION_MINUTES,
      join_url: joinUrl,
      start_url: joinUrl,
      meeting_type: 'group_session',
      calendar_event_id: 'DONE',
      created_by: hostId,
      updated_by: hostId,
    })
    .select('id')
    .single();

  if (insertErr) {
    throw new Error(`Insert failed: ${insertErr.message}`);
  }

  console.log('Inserted test meeting row:', inserted.id);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
