const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createTestStudent() {
  try {
    const email = 'test_student_chat@example.com';
    const password = 'Password123!';
    const fullName = 'Test Student Chat';

    console.log("Checking if test student already exists...");
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const testUser = existingUser.users.find(u => u.email === email);

    let userId;
    if (testUser) {
      console.log("User already exists, using existing user:", testUser.id);
      userId = testUser.id;
    } else {
      console.log("Creating new auth user...");
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: 'student' }
      });

      if (createError) throw createError;
      userId = newUser.user.id;
      console.log("Created user with ID:", userId);
    }

    // Upsert profile
    console.log("Upserting profile...");
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email,
        role: 'student',
        gender: 'other'
      });
    if (profileError) throw profileError;

    // Get first instructor
    const { data: instructors } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'instructor')
      .limit(1);

    const instructorId = instructors?.[0]?.id;
    console.log("Assigned instructor ID:", instructorId);

    // Check if there is an active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', userId)
      .eq('status', 'active')
      .eq('plan_type', 'one_on_one')
      .limit(1);

    if (existingSub && existingSub.length > 0) {
      console.log("Active subscription already exists:", existingSub[0].id);
    } else {
      console.log("Creating active one_on_one subscription...");
      const { data: newSub, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          student_id: userId,
          plan_type: 'one_on_one',
          status: 'active',
          duration_months: 1,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          assigned_instructor_id: instructorId
        })
        .select();

      if (subError) throw subError;
      console.log("Created subscription:", newSub);
    }

    console.log("Success! Test student is ready.");
  } catch (err) {
    console.error("Failed to create test student:", err);
  }
}

createTestStudent();
