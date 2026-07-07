const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Env Variables URL:", supabaseUrl, "Key:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runCheck() {
  console.log("Checking storage buckets...");
  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  if (bucketsErr) {
    console.error("Failed to list buckets:", bucketsErr);
  } else {
    console.log("Buckets:", buckets);
  }

  // Let's test insert into student_resources
  console.log("\nTesting insert into student_resources with service role client...");
  const { data: insertData, error: insertErr } = await supabase
    .from('student_resources')
    .insert({
      student_id: '4fa4c852-c115-483d-b726-6e0b2cb5d70f', // mock UUID
      instructor_id: '4fa4c852-c115-483d-b726-6e0b2cb5d70f',
      file_name: 'test.pdf',
      file_url: 'https://example.com/test.pdf',
      file_size: 1000,
      content_type: 'application/pdf'
    })
    .select()
    .maybeSingle();

  if (insertErr) {
    console.error("Insert into student_resources failed:", insertErr);
  } else {
    console.log("Insert into student_resources succeeded:", insertData);
    // Cleanup
    const { error: deleteErr } = await supabase
      .from('student_resources')
      .delete()
      .eq('id', insertData.id);
    console.log("Cleanup delete error status:", deleteErr);
  }
}

runCheck();
