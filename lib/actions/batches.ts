'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CreateBatchInput {
    name: string;
    startDate: string;       // YYYY-MM-DD
    endDate: string;         // YYYY-MM-DD
    instructorId: string;
    maxStudents: number;
}

/**
 * Creates a new batch and auto-enrolls:
 *  1. All students in the waiting_queue
 *  2. Multi-month rollover students (active group subscriptions with batches_remaining > 0)
 *
 * Also creates a linked group conversation for batch chat.
 */
export async function createAndPopulateBatch(input: CreateBatchInput) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
        .from('profiles')
        .select('role, is_master_instructor')
        .eq('id', user.id)
        .single();

    const canCreate = profile && (
        ['admin', 'client_management', 'staff'].includes(profile.role) ||
        profile.is_master_instructor === true
    );

    if (!canCreate) {
        return { success: false, error: 'You do not have permission to create batches.' };
    }

    try {
        // Step 1: Create group conversation for the batch
        const { data: convo } = await admin.from('conversations').insert({
            type: 'group',
            title: `${input.name} Chat`,
            is_chat_enabled: true,
        }).select().single();

        // Step 2: Create the batch record
        const { data: batch, error: batchError } = await admin
            .from('batches')
            .insert({
                name: input.name,
                instructor_id: input.instructorId,
                start_date: input.startDate,
                end_date: input.endDate,
                max_students: input.maxStudents,
                status: 'upcoming',
                is_chat_enabled: true,
                conversation_id: convo?.id || null,
            })
            .select()
            .single();

        if (batchError) throw new Error('DB Error: ' + batchError.message);
        if (!batch) throw new Error('Failed to create batch record.');

        // Link conversation back to batch
        if (convo) {
            await admin.from('conversations').update({ batch_id: batch.id }).eq('id', convo.id);
        }

        let enrolledCount = 0;
        const enrolledStudentIds = new Set<string>();

        // Step 3: Process waiting queue students
        const { data: queue } = await admin
            .from('waiting_queue')
            .select('*')
            .eq('status', 'waiting')
            .order('requested_at', { ascending: true })
            .limit(input.maxStudents);

        if (queue && queue.length > 0) {
            for (const entry of queue) {
                if (enrolledCount >= input.maxStudents) break;

                const { data: subData } = await admin
                    .from('subscriptions')
                    .select('*')
                    .eq('id', entry.subscription_id)
                    .single();

                if (!subData) continue;

                let updatedEndDate = subData.end_date;

                // Activate pending subscriptions — set start/end dates based on batch start
                if (subData.status === 'pending' || !subData.start_date) {
                    const start = new Date(input.startDate);
                    const end = new Date(start);
                    end.setMonth(start.getMonth() + (subData.duration_months || 1));
                    updatedEndDate = end.toISOString().split('T')[0];

                    await admin
                        .from('subscriptions')
                        .update({
                            status: 'active',
                            start_date: input.startDate,
                            end_date: updatedEndDate,
                        })
                        .eq('id', subData.id);
                }

                // Auto-extend subscription if batch outlasts it
                const isExtended = updatedEndDate && updatedEndDate < input.endDate;
                const effectiveEnd = isExtended ? input.endDate : updatedEndDate;
                if (isExtended) {
                    await admin
                        .from('subscriptions')
                        .update({ end_date: input.endDate })
                        .eq('id', subData.id);
                }

                // Remove any existing trial enrollment for this student
                await admin
                    .from('batch_enrollments')
                    .delete()
                    .eq('student_id', entry.student_id)
                    .eq('is_trial_access', true);

                // Enroll in the new batch
                await admin
                    .from('batch_enrollments')
                    .insert({
                        batch_id: batch.id,
                        student_id: entry.student_id,
                        subscription_id: entry.subscription_id,
                        status: 'active',
                        effective_end_date: effectiveEnd,
                        original_sub_end_date: isExtended ? updatedEndDate : null,
                        is_extended: !!isExtended,
                        is_trial_access: false,
                    });

                // Mark queue entry as assigned
                await admin
                    .from('waiting_queue')
                    .update({ status: 'assigned' })
                    .eq('id', entry.id);

                enrolledStudentIds.add(entry.student_id);
                enrolledCount++;
            }
        }

        // Step 4: Multi-month rollover — enroll students with active group subs and batches_remaining > 0
        if (enrolledCount < input.maxStudents) {
            const { data: activeSubs } = await admin
                .from('subscriptions')
                .select('id, student_id, end_date, batches_remaining, duration_months')
                .eq('plan_type', 'group_session')
                .eq('status', 'active')
                .eq('is_trial', false)
                .gt('batches_remaining', 0);

            if (activeSubs) {
                for (const sub of activeSubs) {
                    if (enrolledCount >= input.maxStudents) break;
                    if (enrolledStudentIds.has(sub.student_id)) continue;

                    // Check student isn't already in another active batch
                    const { data: existing } = await admin
                        .from('batch_enrollments')
                        .select('id')
                        .eq('student_id', sub.student_id)
                        .eq('status', 'active')
                        .eq('is_trial_access', false)
                        .limit(1);

                    if (existing && existing.length > 0) continue;

                    // Auto-extend if batch outlasts subscription
                    const isExtended = sub.end_date && sub.end_date < input.endDate;
                    if (isExtended) {
                        await admin
                            .from('subscriptions')
                            .update({ end_date: input.endDate })
                            .eq('id', sub.id);
                    }

                    await admin
                        .from('batch_enrollments')
                        .insert({
                            batch_id: batch.id,
                            student_id: sub.student_id,
                            subscription_id: sub.id,
                            status: 'active',
                            effective_end_date: isExtended ? input.endDate : sub.end_date,
                            original_sub_end_date: isExtended ? sub.end_date : null,
                            is_extended: !!isExtended,
                            is_trial_access: false,
                        });

                    // Decrement batches remaining
                    await admin
                        .from('subscriptions')
                        .update({ batches_remaining: (sub.batches_remaining || 1) - 1, batches_used: (sub.batches_remaining || 1) > 0 ? 1 : 0 })
                        .eq('id', sub.id);

                    enrolledStudentIds.add(sub.student_id);
                    enrolledCount++;
                }
            }
        }

        // Step 5: Update batch with enrolled count
        await admin
            .from('batches')
            .update({ current_students: enrolledCount })
            .eq('id', batch.id);

        // Step 6: Send notifications to enrolled students
        const notificationRows = Array.from(enrolledStudentIds).map(studentId => ({
            user_id: studentId,
            title: 'You\'ve been enrolled in a new batch!',
            message: `You are now enrolled in "${input.name}" starting ${input.startDate}. Get ready for your transformation journey!`,
            type: 'batch_enrollment',
            is_read: false,
        }));
        if (notificationRows.length > 0) {
            await admin.from('notifications').insert(notificationRows);
        }

        revalidatePath('/instructor/groups');
        revalidatePath('/staff/groups');
        revalidatePath('/student/group-session');
        return { success: true, batchId: batch.id, enrolled: enrolledCount };

    } catch (err: any) {
        console.error("Batch creation failed:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Retrieves all batches — master instructors, staff, admins see all; regular instructors see only theirs.
 */
export async function getInstructorBatches(instructorId: string) {
    const adminClient = createAdminClient();

    const { data: profile } = await adminClient
        .from('profiles')
        .select('role, is_master_instructor')
        .eq('id', instructorId)
        .single();

    const seesAll = profile && (
        ['admin', 'client_management', 'staff'].includes(profile.role) ||
        profile.is_master_instructor === true
    );

    let query = adminClient
        .from('batches')
        .select(`
            *,
            batch_enrollments(
                id,
                student_id,
                status,
                student:profiles!student_id(id, full_name, avatar_url, phone),
                subscription:subscriptions!subscription_id(id, status, end_date, plan_type)
            ),
            instructor:profiles!instructor_id(id, full_name, avatar_url)
        `);

    if (!seesAll) {
        query = query.eq('instructor_id', instructorId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Fetch batches error:', error.message, error.details, error.hint);
        return [];
    }

    return data || [];
}

/**
 * Retrieves the active batch enrollment for a specific student.
 */
export async function getStudentBatchEnrollment(studentId: string) {
    const admin = createAdminClient();

    const { data, error } = await admin
        .from('batch_enrollments')
        .select(`
            *,
            batch:batches(
                *,
                instructor:profiles!instructor_id(full_name, avatar_url)
            )
        `)
        .eq('student_id', studentId)
        .in('status', ['active', 'extended'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Fetch enrollment error:', error);
        return null;
    }

    return data;
}

/**
 * Adds a student to the waiting queue. If an active batch has available slots,
 * grants 2-day trial access instead.
 */
export async function enrollInWaitingQueue(studentId: string, subscriptionId: string) {
    const admin = createAdminClient();

    // Check if there's an active batch with available slots
    const { data: activeBatches } = await admin
        .from('batches')
        .select('id, max_students, current_students')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

    const activeBatch = activeBatches?.[0];
    const hasSlots = activeBatch && (activeBatch.current_students || 0) < (activeBatch.max_students || 30);

    if (activeBatch) {
        // Always grant 2-day trial access to the running batch if someone buys a plan or takes a trial,
        // even if slots are full, because trials are short-lived and this allows them to explore the platform.
        await grantTrialAccess(studentId, subscriptionId, activeBatch.id);
    }

    // Always add to waiting queue (even with trial access, they wait for the NEXT proper batch)
    const { error } = await admin.from('waiting_queue').insert({
        student_id: studentId,
        subscription_id: subscriptionId,
        status: 'waiting',
    });

    if (error) {
        console.error('Waiting queue insert error:', error);
        return { success: false, error: error.message };
    }

    // Notify the student
    await admin.from('notifications').insert({
        user_id: studentId,
        title: hasSlots ? 'Trial access granted!' : 'You\'re in the queue!',
        message: hasSlots
            ? 'You have 2-day trial access to the current batch. Your full subscription will start with the next batch.'
            : 'A batch is currently in progress. You\'ll be notified when the next batch starts. Your subscription will begin on the first day of your batch.',
        type: 'waiting_queue',
        is_read: false,
    });

    revalidatePath('/student/group-session');
    return { success: true, trialGranted: !!hasSlots };
}

/**
 * Grants 2-day trial access to an active batch.
 */
export async function grantTrialAccess(studentId: string, subscriptionId: string, batchId: string) {
    const admin = createAdminClient();

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 2);

    await admin.from('batch_enrollments').insert({
        batch_id: batchId,
        student_id: studentId,
        subscription_id: subscriptionId,
        status: 'active',
        is_trial_access: true,
        effective_end_date: trialEnd.toISOString().split('T')[0],
        is_extended: false,
    });

    // Update batch student count using manual increment (simplest)
    try {
        const { data } = await admin.from('batches')
            .select('current_students')
            .eq('id', batchId)
            .single();
        
        if (data) {
            await admin.from('batches')
                .update({ current_students: (data.current_students || 0) + 1 })
                .eq('id', batchId);
        }
    } catch (e) {
        console.error('Failed to increment batch count:', e);
    }
}

/**
 * Get all students in the waiting queue.
 */
export async function getWaitingQueueStudents() {
    const admin = createAdminClient();

    const { data, error } = await admin
        .from('waiting_queue')
        .select(`
            *,
            student:profiles!student_id(id, full_name, email, avatar_url, phone),
            subscription:subscriptions!subscription_id(id, plan_type, duration_months, status)
        `)
        .eq('status', 'waiting')
        .order('requested_at', { ascending: true });

    if (error) {
        console.error('Fetch waiting queue error:', error);
        return [];
    }

    return data || [];
}

/**
 * Get a student's waiting queue entry.
 */
export async function getStudentWaitingStatus(studentId: string) {
    const admin = createAdminClient();

    const { data } = await admin
        .from('waiting_queue')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'waiting')
        .maybeSingle();

    return data;
}

/**
 * Check for expiring subscriptions and send notifications (5 days before expiry).
 */
export async function checkExpiringSubscriptions() {
    const admin = createAdminClient();

    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const { data: expiringSubs } = await admin
        .from('subscriptions')
        .select('id, student_id, end_date, plan_type')
        .eq('status', 'active')
        .eq('plan_type', 'group_session')
        .eq('is_trial', false)
        .lte('end_date', fiveDaysFromNow)
        .gte('end_date', today);

    if (!expiringSubs || expiringSubs.length === 0) return;

    for (const sub of expiringSubs) {
        // Check if notification already sent for this subscription
        const { data: existing } = await admin
            .from('notifications')
            .select('id')
            .eq('user_id', sub.student_id)
            .eq('type', 'subscription_expiry')
            .ilike('message', `%${sub.id}%`)
            .limit(1);

        if (existing && existing.length > 0) continue;

        await admin.from('notifications').insert({
            user_id: sub.student_id,
            title: 'Subscription Expiring Soon',
            message: `Your group session subscription expires on ${sub.end_date}. Renew now to continue in the next batch! (ref:${sub.id})`,
            type: 'subscription_expiry',
            is_read: false,
        });
    }
}

export async function getWaitingQueue() {
    const admin = createAdminClient();
    const { data, error } = await admin
        .from('waiting_queue')
        .select(`
            *,
            student:profiles!student_id(id, full_name, avatar_url, phone)
        `)
        .eq('status', 'waiting')
        .order('requested_at', { ascending: true });

    if (error) {
        console.error('Error fetching waiting queue:', error);
        return [];
    }
    return data || [];
}

/**
 * Toggles the chat enablement for a specific batch.
 */
export async function toggleBatchChat(batchId: string, isEnabled: boolean) {
    const admin = createAdminClient();
    
    // Update both batch and linked conversation
    const { data: batch } = await admin
        .from('batches')
        .update({ is_chat_enabled: isEnabled })
        .eq('id', batchId)
        .select('conversation_id')
        .single();

    if (batch?.conversation_id) {
        await admin
            .from('conversations')
            .update({ is_chat_enabled: isEnabled })
            .eq('id', batch.conversation_id);
    }

    revalidatePath('/instructor/groups');
    revalidatePath('/student/group-session');
    return { success: true };
}
