const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const email = `test_signup_nophone_${Date.now()}@example.com`;
  const password = 'Password123!';
  const fullName = 'Test Signup No Phone';

  console.log('Attempting signup with email (NO PHONE):', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'student',
      },
    },
  });

  if (error) {
    console.error('Signup failed!');
    console.error('Error Code:', error.status);
    console.error('Error Message:', error.message);
  } else {
    console.log('Signup succeeded!');
    const userId = data.user?.id;
    console.log('User ID:', userId);

    // Let's check if the profile exists in public.profiles!
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking profile:', profileError);
    } else if (profile) {
      console.log('Profile was created successfully:', profile);
    } else {
      console.log('❌ Profile was NOT created (no profile row found for id)!');
    }

    if (userId) {
      await admin.auth.admin.deleteUser(userId);
      console.log('Deleted test user:', userId);
    }
  }
}

main();
