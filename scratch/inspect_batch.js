const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: batch, error } = await supabase
    .from('batches')
    .select('*')
    .eq('id', 'dabb067d-c796-46eb-a437-cd05d5196a5c')
    .single();

  if (error) {
    console.error(error);
  } else {
    console.log('Batch Details:', batch);
  }
}

main();
