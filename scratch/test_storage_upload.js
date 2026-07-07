const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Env Variables URL:", supabaseUrl, "Key:", !!supabaseServiceKey);
  process.exit(1);
}

// Create admin client (with service role key)
const admin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runUploadTest() {
  const mockBuffer = Buffer.from("Hello World from upload test");
  const uniquePath = `test-folder/test-${Date.now()}.txt`;
  
  console.log("Uploading file to resources bucket using service role key...");
  const { data, error } = await admin.storage
    .from('resources')
    .upload(uniquePath, mockBuffer, {
      contentType: 'text/plain',
      upsert: false
    });

  if (error) {
    console.error("Upload failed:", error);
  } else {
    console.log("Upload succeeded! Data:", data);
    // Cleanup
    console.log("Cleaning up...");
    const { error: removeError } = await admin.storage
      .from('resources')
      .remove([uniquePath]);
    console.log("Cleanup status:", removeError ? removeError : "Success");
  }
}

runUploadTest();
