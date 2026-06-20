require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const userId = '57358b57-2161-4eda-99fb-c3e11d3cd776';

  const today = new Date().toISOString().split('T')[0];
  
  const oneYearFromNowDate = new Date();
  oneYearFromNowDate.setFullYear(oneYearFromNowDate.getFullYear() + 1);
  const oneYearFromNow = oneYearFromNowDate.toISOString().split('T')[0];

  const fiftyYearsFromNowDate = new Date();
  fiftyYearsFromNowDate.setFullYear(fiftyYearsFromNowDate.getFullYear() + 50);
  const fiftyYearsFromNow = fiftyYearsFromNowDate.toISOString().split('T')[0];

  console.log(`Starting access grant for user: ${userId}`);

  // 1. Check if user profile exists
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr) {
    console.error('Error fetching profile:', profileErr);
    process.exit(1);
  }

  if (!profile) {
    console.log('Profile not found in profiles table. Checking auth.users...');
    const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(userId);
    if (authErr || !authData.user) {
      console.error(`User with ID ${userId} does not exist in Auth. Please make sure this user is signed up.`);
      process.exit(1);
    }
    
    console.log(`User found in Auth: ${authData.user.email}. Creating profile...`);
    const { data: newProfile, error: createProfileErr } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: 'Grant Access User',
        email: authData.user.email,
        role: 'student',
      })
      .select()
      .single();

    if (createProfileErr) {
      console.error('Error creating profile:', createProfileErr);
      process.exit(1);
    }
    console.log('Profile created successfully.');
  } else {
    console.log(`Profile exists for: ${profile.full_name} (${profile.email})`);
  }

  // 2. Grant One-on-One
  console.log('\n--- 1-on-1 Classes Access ---');
  const { data: existingOneOnOne } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('student_id', userId)
    .eq('plan_type', 'one_on_one')
    .maybeSingle();

  let oneOnOneSubId = '';
  if (existingOneOnOne) {
    const { error: updateErr } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        start_date: today,
        end_date: oneYearFromNow,
        duration_months: 12,
        is_trial: false,
        payment_id: 'admin_granted_one_on_one',
      })
      .eq('id', existingOneOnOne.id);

    if (updateErr) {
      console.error('Failed to update 1-on-1 subscription:', updateErr);
    } else {
      console.log('Successfully updated existing 1-on-1 subscription to active.');
      oneOnOneSubId = existingOneOnOne.id;
    }
  } else {
    const { data: newSub, error: insertErr } = await supabase
      .from('subscriptions')
      .insert({
        student_id: userId,
        plan_type: 'one_on_one',
        status: 'active',
        duration_months: 12,
        start_date: today,
        end_date: oneYearFromNow,
        amount: 30000,
        currency: 'INR',
        payment_id: 'admin_granted_one_on_one',
        batches_remaining: 1,
        batches_used: 0,
        is_trial: false,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Failed to insert 1-on-1 subscription:', insertErr);
    } else {
      console.log('Successfully created active 1-on-1 subscription.');
      oneOnOneSubId = newSub.id;
    }
  }

  // 3. Grant LMS
  console.log('\n--- LMS Classes Access ---');
  const { data: existingLMS } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('student_id', userId)
    .eq('plan_type', 'lms')
    .maybeSingle();

  if (existingLMS) {
    const { error: updateErr } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        plan_variant: 'level_1_2',
        start_date: today,
        end_date: fiftyYearsFromNow,
        duration_months: 999,
        is_trial: false,
        payment_id: 'admin_granted_lms',
      })
      .eq('id', existingLMS.id);

    if (updateErr) {
      console.error('Failed to update LMS subscription:', updateErr);
    } else {
      console.log('Successfully updated existing LMS subscription to active (Level 1 + 2).');
    }
  } else {
    const { error: insertErr } = await supabase
      .from('subscriptions')
      .insert({
        student_id: userId,
        plan_type: 'lms',
        plan_variant: 'level_1_2',
        status: 'active',
        duration_months: 999,
        start_date: today,
        end_date: fiftyYearsFromNow,
        amount: 1499,
        currency: 'INR',
        payment_id: 'admin_granted_lms',
        batches_remaining: 1,
        batches_used: 0,
        is_trial: false,
      });

    if (insertErr) {
      console.error('Failed to insert LMS subscription:', insertErr);
    } else {
      console.log('Successfully created active LMS subscription (Level 1 + 2).');
    }
  }

  // 4. Grant Group Session
  console.log('\n--- Group Sessions Access ---');
  const { data: existingGroup } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('student_id', userId)
    .eq('plan_type', 'group_session')
    .maybeSingle();

  let groupSubId = '';
  if (existingGroup) {
    const { error: updateErr } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        start_date: today,
        end_date: oneYearFromNow,
        duration_months: 12,
        is_trial: false,
        payment_id: 'admin_granted_group_session',
        batches_remaining: 12,
      })
      .eq('id', existingGroup.id);

    if (updateErr) {
      console.error('Failed to update group session subscription:', updateErr);
    } else {
      console.log('Successfully updated existing group session subscription to active.');
      groupSubId = existingGroup.id;
    }
  } else {
    const { data: newSub, error: insertErr } = await supabase
      .from('subscriptions')
      .insert({
        student_id: userId,
        plan_type: 'group_session',
        status: 'active',
        duration_months: 12,
        start_date: today,
        end_date: oneYearFromNow,
        amount: 3499,
        currency: 'INR',
        payment_id: 'admin_granted_group_session',
        batches_remaining: 12,
        batches_used: 0,
        is_trial: false,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Failed to insert group session subscription:', insertErr);
    } else {
      console.log('Successfully created active group session subscription.');
      groupSubId = newSub.id;
    }
  }

  // 5. Enroll in active batch
  console.log('\n--- Batch Enrollment ---');
  const { data: activeBatches, error: abErr } = await supabase
    .from('batches')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { descending: false }) // earliest first or latest? let's do latest
    .order('created_at', { ascending: false })
    .limit(1);

  if (abErr) {
    console.error('Error fetching active batches:', abErr);
  } else if (activeBatches && activeBatches.length > 0) {
    const activeBatch = activeBatches[0];
    console.log(`Active batch found: ${activeBatch.name} (ID: ${activeBatch.id})`);

    const { data: existingEnrollment } = await supabase
      .from('batch_enrollments')
      .select('*')
      .eq('student_id', userId)
      .eq('batch_id', activeBatch.id)
      .maybeSingle();

    if (existingEnrollment) {
      const { error: updateEnrollErr } = await supabase
        .from('batch_enrollments')
        .update({
          status: 'active',
          subscription_id: groupSubId,
          effective_end_date: activeBatch.end_date,
          is_trial_access: false,
        })
        .eq('id', existingEnrollment.id);

      if (updateEnrollErr) {
        console.error('Failed to update batch enrollment:', updateEnrollErr);
      } else {
        console.log(`Updated existing batch enrollment in "${activeBatch.name}" to active.`);
      }
    } else {
      const { error: insertEnrollErr } = await supabase
        .from('batch_enrollments')
        .insert({
          batch_id: activeBatch.id,
          student_id: userId,
          subscription_id: groupSubId,
          status: 'active',
          is_trial_access: false,
          effective_end_date: activeBatch.end_date,
          is_extended: false,
        });

      if (insertEnrollErr) {
        console.error('Failed to insert batch enrollment:', insertEnrollErr);
      } else {
        console.log(`Created new batch enrollment in "${activeBatch.name}".`);
        
        // Try to increment current students count
        try {
          await supabase.rpc('increment_batch_count', { batch_id: activeBatch.id });
          console.log('Incremented student count via RPC.');
        } catch (e) {
          // fallback
          const { data: currentB } = await supabase
            .from('batches')
            .select('current_students')
            .eq('id', activeBatch.id)
            .single();
          await supabase
            .from('batches')
            .update({ current_students: (currentB?.current_students || 0) + 1 })
            .eq('id', activeBatch.id);
          console.log('Incremented student count via update.');
        }
      }
    }
  } else {
    console.log('No active batch found to enroll user in.');
  }

  console.log('\nAccess grant completed!');
}

main();
