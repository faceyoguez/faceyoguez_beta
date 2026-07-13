import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .limit(3);
  
  if (error) console.error(error);
  else console.table(data);
}
checkProfile();
