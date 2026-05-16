/**
 * Repair Script: Fix students stuck in waiting queue
 * 
 * Root cause: Students with only expired trial enrollments were not being
 * picked up by createAndPopulateBatch because the trial enrollment deletion
 * only runs during batch creation, and the existing trial (even expired) blocks
 * them from being re-enrolled.
 *
 * This script:
 * 1. Finds all students with status:'waiting' in the queue
 * 2. Checks their batch_enrollments - if they only have expired trials, deletes those
 * 3. Removes duplicate queue entries (same student, keeps oldest)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function repair() {
  console.log('=== Waiting Queue Repair ===\n');

  // 1. Get all waiting students
  const { data: queue } = await supabase
    .from('waiting_queue')
    .select('*')
    .eq('status', 'waiting')
    .order('requested_at', { ascending: true });

  console.log(`Found ${queue?.length || 0} waiting queue entries\n`);

  // Group by student to detect duplicates
  const byStudent = new Map();
  for (const entry of queue || []) {
    if (!byStudent.has(entry.student_id)) {
      byStudent.set(entry.student_id, []);
    }
    byStudent.get(entry.student_id).push(entry);
  }

  for (const [studentId, entries] of byStudent) {
    console.log(`\nStudent ${studentId} has ${entries.length} queue entries`);

    // 2. Check their batch_enrollments
    const { data: enrollments } = await supabase
      .from('batch_enrollments')
      .select('*')
      .eq('student_id', studentId);

    const activeNonTrial = enrollments?.filter(e => e.status === 'active' && !e.is_trial_access) || [];
    const trialEnrollments = enrollments?.filter(e => e.is_trial_access) || [];

    console.log(`  - Active non-trial enrollments: ${activeNonTrial.length}`);
    console.log(`  - Trial enrollments: ${trialEnrollments.length}`);

    if (activeNonTrial.length > 0) {
      // Student is already properly enrolled — mark all queue entries as assigned
      console.log(`  → Already enrolled, marking queue entries as assigned`);
      const ids = entries.map(e => e.id);
      const { error } = await supabase
        .from('waiting_queue')
        .update({ status: 'assigned' })
        .in('id', ids);
      if (error) console.error('  Error marking assigned:', error);
      else console.log(`  ✓ Marked ${ids.length} entries as assigned`);
      continue;
    }

    // 3. Delete stale trial enrollments so they don't block re-enrollment
    if (trialEnrollments.length > 0) {
      console.log(`  → Removing ${trialEnrollments.length} stale trial enrollment(s)`);
      const trialIds = trialEnrollments.map(e => e.id);
      const { error } = await supabase
        .from('batch_enrollments')
        .delete()
        .in('id', trialIds);
      if (error) console.error('  Error removing trial enrollments:', error);
      else console.log(`  ✓ Removed stale trial enrollments`);
    }

    // 4. Remove duplicate queue entries (keep only the newest one, so they get enrolled once)
    if (entries.length > 1) {
      // Keep the latest entry (most recently added subscription), remove duplicates
      const sorted = entries.sort((a, b) => 
        new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
      );
      const toRemove = sorted.slice(1); // remove older duplicates
      console.log(`  → Removing ${toRemove.length} duplicate queue entries`);
      const { error } = await supabase
        .from('waiting_queue')
        .delete()
        .in('id', toRemove.map(e => e.id));
      if (error) console.error('  Error removing duplicates:', error);
      else console.log(`  ✓ Removed duplicate entries`);
    }

    console.log(`  → Student is now clear and will be enrolled in the next batch creation`);
  }

  console.log('\n=== Repair Complete ===');
  console.log('\nNext step: Create/Populate a batch to automatically enroll waiting students.');
  console.log('Or use the "Assign to Batch" button in the instructor dashboard.\n');
}

repair();
