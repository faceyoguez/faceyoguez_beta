// Script: Update Level 1 & 2 course thumbnails
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

async function run() {
  console.log('Updating Level 1 thumbnail...');
  const { error: err1 } = await supabase
    .from('lms_courses')
    .update({ thumbnail_url: '/assets/carousel_img_2.jpg' })
    .eq('level', 1);

  if (err1) {
    console.error('Failed to update Level 1 thumbnail:', err1);
  } else {
    console.log('✅ Level 1 thumbnail updated to /assets/carousel_img_2.jpg');
  }

  console.log('Updating Level 2 thumbnail...');
  const { error: err2 } = await supabase
    .from('lms_courses')
    .update({ thumbnail_url: '/assets/carousel_img_3.jpg' })
    .eq('level', 2);

  if (err2) {
    console.error('Failed to update Level 2 thumbnail:', err2);
  } else {
    console.log('✅ Level 2 thumbnail updated to /assets/carousel_img_3.jpg');
  }
}

run();
