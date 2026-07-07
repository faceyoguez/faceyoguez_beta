// Script: update Level 1 & Level 2 LMS course titles and module names
// Run from project root: node scratch/update_lms_level1.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually
const envPath = resolve(__dirname, '../.env.local');
const env = {};
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) {
    let val = vals.join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key.trim()] = val;
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const L1_TITLES = [
  'Wakeup call to face muscles',
  'Root to Glow',
  'Tension finder & release',
  'Beyond the surface work',
  'The great Flush',
  'Full Face Reset',
  'Bright & open Eyes',
  'The Lower Lift',
  'Upper Face Refresh',
  'Cheek Goals',
  'Define & Refine Jawline',
  'Full Face Exercises',
  'The Ancient Touch , Marma Magic',
  'Rise & Glow',
  'Upper Lift Blend',
  'Lower Glow Blend',
];

const L2_TITLES = [
  'The Complete Foundation',
  'The Upper Release',
  'Strong & Lifted Cheeks',
  'Jaw mastery',
  'Lift from within',
  'Full Face Everything Advance',
  'Below & Lifted',
  'Above & Lifted',
  'The Upper Trinity',
  'Cheeks Transformation',
  'Complete Lower Lift',
  'Face at Full Power',
  'Upper Mastery Blend',
  'Cheeks to Chin Mastery',
  'The Full Face Mastery 1',
  'The Full Face Mastery 2',
];

async function updateLevel(level, courseTitle, moduleTitles) {
  console.log(`--- Updating Level ${level} ---`);
  
  // 1. Find course
  const { data: course, error: courseErr } = await supabase
    .from('lms_courses')
    .select('id, title, level')
    .eq('level', level)
    .single();

  if (courseErr || !course) {
    console.error(`Could not find Level ${level} course:`, courseErr);
    return;
  }

  console.log('Found course:', course.id, '|', course.title);

  // 2. Update course title
  const { error: titleErr } = await supabase
    .from('lms_courses')
    .update({ title: courseTitle })
    .eq('id', course.id);

  if (titleErr) {
    console.error(`Failed to update course title:`, titleErr);
  } else {
    console.log(`✅ Updated course title to: ${courseTitle}`);
  }

  // 3. Fetch modules sorted by order_index
  const { data: modules, error: modErr } = await supabase
    .from('lms_modules')
    .select('id, title, order_index')
    .eq('course_id', course.id)
    .order('order_index', { ascending: true });

  if (modErr || !modules) {
    console.error('Could not fetch modules:', modErr);
    return;
  }

  console.log(`Found ${modules.length} modules`);

  // 4. Update each module title
  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const newTitle = moduleTitles[i];
    if (!newTitle) {
      console.warn(`No new title for module index ${i}: ${mod.title}`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from('lms_modules')
      .update({ title: newTitle })
      .eq('id', mod.id);

    if (updateErr) {
      console.error(`Failed to update module ${i + 1} (${mod.title}):`, updateErr);
    } else {
      console.log(`✅ D${i + 1}: "${mod.title}" → "${newTitle}"`);
    }
  }
}

async function run() {
  await updateLevel(1, 'L1 The Glow Foundation', L1_TITLES);
  await updateLevel(2, 'L2 The Glow Accelerator', L2_TITLES);
  console.log('\nAll migrations done!');
}

run();
