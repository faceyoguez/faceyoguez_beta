import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const updates = [
    { id: '90766b4b-3d6b-4303-83fc-419439f5b63a', from: 'L1 The Glow Foundation', to: 'The Glow Foundation' },
    { id: 'd62afce2-c7ae-435b-bc86-f6b0d9238ade', from: 'L2 The Glow Accelerator', to: 'The Glow Accelerator' },
  ];

  for (const u of updates) {
    const { data, error } = await supabase
      .from('lms_courses')
      .update({ title: u.to })
      .eq('id', u.id)
      .eq('title', u.from)
      .select('id, title');
    if (error) { console.error(`Failed updating ${u.id}:`, error); process.exit(1); }
    console.log('Updated:', data);
  }
}
main();
