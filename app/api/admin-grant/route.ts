import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const userId = '57358b57-2161-4eda-99fb-c3e11d3cd776';
  const admin = createAdminClient();

  const today = new Date().toISOString().split('T')[0];
  const oneYearFromNowDate = new Date();
  oneYearFromNowDate.setFullYear(oneYearFromNowDate.getFullYear() + 1);
  const oneYearFromNow = oneYearFromNowDate.toISOString().split('T')[0];

  const fiftyYearsFromNowDate = new Date();
  fiftyYearsFromNowDate.setFullYear(fiftyYearsFromNowDate.getFullYear() + 50);
  const fiftyYearsFromNow = fiftyYearsFromNowDate.toISOString().split('T')[0];

  const results: any = {
    userId,
    profileStatus: 'unknown',
    oneOnOneStatus: 'skipped',
    lmsStatus: 'skipped',
    groupSessionStatus: 'skipped',
    batchEnrollmentStatus: 'skipped',
  };

  try {
    // 1. Verify/Upsert Profile
    console.log('1. Checking user profile...');
    let { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) {
      return NextResponse.json({ error: 'Failed to query profiles: ' + profileErr.message }, { status: 500 });
    }

    if (!profile) {
      console.log('Profile not found, checking auth.users...');
      const { data: authData, error: authErr } = await admin.auth.admin.getUserById(userId);
      if (authErr || !authData.user) {
        // If user does not exist in auth, let's create a dummy profile or return error
        return NextResponse.json({
          error: `User with ID ${userId} does not exist in Auth. Please sign up this user first or check ID.`
        }, { status: 400 });
      }

      console.log('User found in auth. Creating profile...');
      const { data: newProfile, error: createProfileErr } = await admin
        .from('profiles')
        .insert({
          id: userId,
          full_name: 'Test User',
          email: authData.user.email || 'test@example.com',
          role: 'student',
        })
        .select()
        .single();

      if (createProfileErr) {
        return NextResponse.json({ error: 'Failed to create profile: ' + createProfileErr.message }, { status: 500 });
      }
      profile = newProfile;
      results.profileStatus = 'created';
    } else {
      results.profileStatus = 'exists';
    }

    // 2. Grant One-on-One Class Access
    console.log('2. Granting One-on-One...');
    const { data: existingOneOnOne, error: oErr } = await admin
      .from('subscriptions')
      .select('id')
      .eq('student_id', userId)
      .eq('plan_type', 'one_on_one')
      .maybeSingle();

    let oneOnOneSubId = '';
    if (existingOneOnOne) {
      const { error: updateErr } = await admin
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

      if (updateErr) throw new Error('Update one_on_one error: ' + updateErr.message);
      oneOnOneSubId = existingOneOnOne.id;
      results.oneOnOneStatus = 'updated';
    } else {
      const { data: newSub, error: insertErr } = await admin
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

      if (insertErr) throw new Error('Insert one_on_one error: ' + insertErr.message);
      oneOnOneSubId = newSub.id;
      results.oneOnOneStatus = 'inserted';
    }

    // 3. Grant LMS Session Access (with Level 1 and 2)
    console.log('3. Granting LMS...');
    const { data: existingLMS, error: lErr } = await admin
      .from('subscriptions')
      .select('id')
      .eq('student_id', userId)
      .eq('plan_type', 'lms')
      .maybeSingle();

    if (existingLMS) {
      const { error: updateErr } = await admin
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

      if (updateErr) throw new Error('Update lms error: ' + updateErr.message);
      results.lmsStatus = 'updated';
    } else {
      const { error: insertErr } = await admin
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

      if (insertErr) throw new Error('Insert lms error: ' + insertErr.message);
      results.lmsStatus = 'inserted';
    }

    // 4. Grant Group Session Access
    console.log('4. Granting Group Session...');
    const { data: existingGroup, error: gErr } = await admin
      .from('subscriptions')
      .select('id')
      .eq('student_id', userId)
      .eq('plan_type', 'group_session')
      .maybeSingle();

    let groupSubId = '';
    if (existingGroup) {
      const { error: updateErr } = await admin
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

      if (updateErr) throw new Error('Update group_session error: ' + updateErr.message);
      groupSubId = existingGroup.id;
      results.groupSessionStatus = 'updated';
    } else {
      const { data: newSub, error: insertErr } = await admin
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

      if (insertErr) throw new Error('Insert group_session error: ' + insertErr.message);
      groupSubId = newSub.id;
      results.groupSessionStatus = 'inserted';
    }

    // 5. Enroll in latest active batch (if exists)
    console.log('5. Checking active batch for enrollment...');
    const { data: activeBatches, error: abErr } = await admin
      .from('batches')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (abErr) {
      results.batchEnrollmentStatus = 'error: ' + abErr.message;
    } else if (activeBatches && activeBatches.length > 0) {
      const activeBatch = activeBatches[0];
      results.batchName = activeBatch.name;

      const { data: existingEnrollment } = await admin
        .from('batch_enrollments')
        .select('*')
        .eq('student_id', userId)
        .eq('batch_id', activeBatch.id)
        .maybeSingle();

      if (existingEnrollment) {
        const { error: updateEnrollErr } = await admin
          .from('batch_enrollments')
          .update({
            status: 'active',
            subscription_id: groupSubId,
            effective_end_date: activeBatch.end_date,
            is_trial_access: false,
          })
          .eq('id', existingEnrollment.id);

        if (updateEnrollErr) {
          results.batchEnrollmentStatus = 'update_error: ' + updateEnrollErr.message;
        } else {
          results.batchEnrollmentStatus = 'updated';
        }
      } else {
        const { error: insertEnrollErr } = await admin
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
          results.batchEnrollmentStatus = 'insert_error: ' + insertEnrollErr.message;
        } else {
          // Increment student count
          try {
            await admin.rpc('increment_batch_count', { batch_id: activeBatch.id });
          } catch (e) {
            // Fallback: manually increment
            const { data: currentB } = await admin
              .from('batches')
              .select('current_students')
              .eq('id', activeBatch.id)
              .single();
            await admin
              .from('batches')
              .update({ current_students: (currentB?.current_students || 0) + 1 })
              .eq('id', activeBatch.id);
          }
          results.batchEnrollmentStatus = 'enrolled';
        }
      }
    } else {
      results.batchEnrollmentStatus = 'no_active_batch_found';
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results }, { status: 500 });
  }
}
