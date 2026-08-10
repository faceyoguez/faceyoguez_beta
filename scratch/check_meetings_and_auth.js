const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const ids = ['2f7c54cd-0251-4eca-a584-d6b4c23933ad', 'c07f973a-05c9-4d32-aecc-65f80eb91185'];

  for (const id of ids) {
    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(id);
    console.log(`\n=== AUTH USER (${id}) ===`);
    console.log(authUser ? { id: authUser.user.id, email: authUser.user.email, last_sign_in_at: authUser.user.last_sign_in_at } : authErr);

    const { data: meetings } = await supabase
      .from('meetings')
      .select('*')
      .or(`student_id.eq.${id},host_id.eq.${id}`);
    console.log(`Meetings for ${id}:`, JSON.stringify(meetings, null, 2));

    const { data: oneOnOneSlots } = await supabase
      .from('one_on_one_slots')
      .select('*')
      .eq('booked_by', id);
    console.log(`One-on-one slots booked by ${id}:`, JSON.stringify(oneOnOneSlots, null, 2));
  }
}

main();
