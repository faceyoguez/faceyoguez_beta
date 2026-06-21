const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STUDENT_ID = '57358b57-2161-4eda-99fb-c3e11d3cd776';
const LOG_ID = '7fcb65dd-b3cf-4cc3-af50-2b04185dbdd5';
const DAY_NUMBER = 1;

const LEFT_PATH = '/Users/joelsiby/.gemini/antigravity-ide/brain/54c93106-c58c-4c3e-8435-89302bcac5aa/media__1782045441535.jpg';
const RIGHT_PATH = '/Users/joelsiby/.gemini/antigravity-ide/brain/54c93106-c58c-4c3e-8435-89302bcac5aa/media__1782045446711.jpg';

async function uploadPhoto(filePath, angle) {
  console.log(`Reading file: ${filePath}`);
  const fileBuffer = fs.readFileSync(filePath);
  const fileExt = 'jpeg';
  const fileName = `${STUDENT_ID}/day_${DAY_NUMBER}_${angle}_${uuidv4()}.${fileExt}`;

  console.log(`Uploading to storage: ${fileName}`);
  const { data, error } = await supabase.storage
    .from('journey-photos')
    .upload(fileName, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('journey-photos')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

async function main() {
  try {
    const leftUrl = await uploadPhoto(LEFT_PATH, 'left');
    console.log(`Left photo uploaded successfully. URL: ${leftUrl}`);

    const rightUrl = await uploadPhoto(RIGHT_PATH, 'right');
    console.log(`Right photo uploaded successfully. URL: ${rightUrl}`);

    console.log(`Updating database row ${LOG_ID}...`);
    const { data, error } = await supabase
      .from('journey_logs')
      .update({
        photo_url_left: leftUrl,
        photo_url_right: rightUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', LOG_ID)
      .select();

    if (error) {
      throw error;
    }

    console.log('Successfully updated journey_logs table:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('An error occurred:', err);
  }
}

main();
