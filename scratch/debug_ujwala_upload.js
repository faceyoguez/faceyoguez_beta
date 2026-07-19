// Test the actual save flow for Ujwala
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role to test the RLS-bypassed scenario
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const UJWALA_ID = 'c07f973a-05c9-4d32-aecc-65f80eb91185';

async function main() {
  console.log('=== Testing Ujwala Upload Issue ===\n');

  // 1. Check current journey logs
  console.log('1. Current Journey Logs:');
  const { data: logs } = await adminClient
    .from('journey_logs')
    .select('*')
    .eq('student_id', UJWALA_ID)
    .order('day_number');
  console.log(JSON.stringify(logs, null, 2));

  // 2. Check storage bucket policies
  console.log('\n2. Checking storage buckets:');
  const { data: buckets, error: bError } = await adminClient.storage.listBuckets();
  if (bError) console.error('Bucket error:', bError);
  else console.log('Buckets:', buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })));

  // 3. Try to list files in journey-photos for Ujwala
  console.log('\n3. Files in journey-photos for Ujwala:');
  const { data: files, error: fError } = await adminClient.storage
    .from('journey-photos')
    .list(UJWALA_ID);
  if (fError) console.error('Files error:', fError);
  else console.log('Files:', files);

  // 4. Test what the current day calculation gives
  const subscriptionStartDate = '2026-07-06';
  const startDate = new Date(subscriptionStartDate);
  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  console.log(`\n4. Current Day Calculation:`);
  console.log(`   Subscription start: ${subscriptionStartDate}`);
  console.log(`   Now (server): ${now.toISOString()}`);
  console.log(`   Diff days: ${diffDays}`);
  console.log(`   PHOTO_MILESTONE_DAYS: [1, 7, 14, 21, 25, 30]`);
  
  // Determine active upload milestone
  const PHOTO_MILESTONE_DAYS = [1, 7, 14, 21, 25, 30];
  let activeUploadMilestone = PHOTO_MILESTONE_DAYS[0];
  let nextMilestoneDay = PHOTO_MILESTONE_DAYS[1];
  for (let i = 0; i < PHOTO_MILESTONE_DAYS.length; i++) {
    if (diffDays >= PHOTO_MILESTONE_DAYS[i]) {
      activeUploadMilestone = PHOTO_MILESTONE_DAYS[i];
      nextMilestoneDay = PHOTO_MILESTONE_DAYS[i + 1] || (PHOTO_MILESTONE_DAYS[i] + 7);
    }
  }
  console.log(`   activeUploadMilestone: ${activeUploadMilestone}`);
  console.log(`   nextMilestoneDay: ${nextMilestoneDay}`);
  
  // For Day 1 tab
  const dayNumber = 1;
  const isDay1 = dayNumber === 1;
  const isPast = dayNumber < activeUploadMilestone;
  const hasPhotos = false; // no photos at all
  const isDay1LateUpload = isDay1 && !hasPhotos && isPast;
  const hasSavedDay1 = false;
  const isBaselineMissing = !isDay1 && !hasSavedDay1 && diffDays > 1;
  
  console.log(`\n5. Flags when viewing Day 1 tab (dayNumber=1):`);
  console.log(`   isDay1: ${isDay1}`);
  console.log(`   isPast: ${isPast}`);
  console.log(`   hasPhotos: ${hasPhotos}`);
  console.log(`   isDay1LateUpload: ${isDay1LateUpload}`);
  console.log(`   isBaselineMissing: ${isBaselineMissing}`);
  console.log(`   Gate check [isPast && !isDay1LateUpload]: ${isPast && !isDay1LateUpload}`);
  console.log(`   Upload form check [isDay1 && (false || isDay1LateUpload)]: ${isDay1 && isDay1LateUpload}`);
  
  // 6. Check Day 14 scenario
  const dayNumber14 = 14;
  const isDay1For14 = dayNumber14 === 1;
  const isPastFor14 = dayNumber14 < activeUploadMilestone;
  const isFutureFor14 = dayNumber14 > activeUploadMilestone;
  const isEditableFor14 = dayNumber14 === activeUploadMilestone;
  const isBaselineMissingFor14 = !isDay1For14 && !hasSavedDay1 && diffDays > 1;
  console.log(`\n6. Flags when viewing Day 14 tab (dayNumber=14):`);
  console.log(`   activeUploadMilestone: ${activeUploadMilestone}`);
  console.log(`   isEditable: ${isEditableFor14}`);
  console.log(`   isPast: ${isPastFor14}`);
  console.log(`   isFuture: ${isFutureFor14}`);
  console.log(`   isBaselineMissing: ${isBaselineMissingFor14}`);
  console.log(`   → Result: ${isBaselineMissingFor14 ? 'BLOCKED - Day 1 baseline required' : isPastFor14 ? 'LOCKED PAST' : isFutureFor14 ? 'LOCKED FUTURE' : 'EDITABLE'}`);
}

main().catch(console.error);
