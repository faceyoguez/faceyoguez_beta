const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBatchAndNazia() {
  const batchId = 'dabb067d-c796-46eb-a437-cd05d5196a5c';
  const { data: batch } = await supabase
    .from('batches')
    .select('*')
    .eq('id', batchId)
    .single();
  console.log("Batch:", batch);
}

checkBatchAndNazia();
