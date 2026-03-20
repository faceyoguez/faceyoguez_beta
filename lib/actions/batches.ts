'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Interface matching the front end form fields for a new Batch
export interface CreateBatchInput {
    name: string;
    startDate: string;       // YYYY-MM-DD
    endDate: string;         // YYYY-MM-DD
    instructorId: string;
    maxStudents: number;
}

/**
 * Executes the complex "Smart Rollover" logic upon a new Batch creation.
 * 
 * 1. Creates a new conversation thread for the batch.
 * 2. Creates the `batch` record.
 * 3. Identifies ALL waitlisted students in the `waiting_queue`.
 * 4. Iterates through them to update their `subscriptions` (assigning Start/End dates if pending).
 * 5. Injects them into `batch_enrollments` for the new batch.
 * 6. Drops them from the `waiting_queue`.
 */
export async function createAndPopulateBatch(input: CreateBatchInput) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Permission check: only admin, client_management, staff, or master instructor can create batches
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
        // Step 1: Create the Batch
        const { data: batch, error: batchError } = await supabase
            .from('batches')
            .insert({
                name: input.name,
                instructor_id: input.instructorId,
                start_date: input.startDate,
                end_date: input.endDate,
                max_students: input.maxStudents,
                status: 'upcoming',
                is_chat_enabled: true
            })
            .select()
            .single();

        if (batchError) throw new Error('DB Error: ' + batchError.message);
        if (!batch) throw new Error('Failed to create batch record.');

        // Step 2: Fetch Waiting Queue Candidates
        const { data: queue, error: queueError } = await supabase
            .from('waiting_queue')
            .select('*')
            .eq('status', 'waiting')
            .order('requested_at', { ascending: true })
            .limit(input.maxStudents);

        if (queueError) throw new Error('Could not pull from waiting queue: ' + queueError.message);

        let enrolledCount = 0;

        // Step 3-5: The Rollover Processing Loop
        if (queue && queue.length > 0) {
            for (const waitlistEntry of queue) {
                // Determine if this subscription was "Pending" start date
                const { data: subData } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('id', waitlistEntry.subscription_id)
                    .single();

                if (subData) {
                    let updatedEndDate = subData.end_date;

                    // If it was a pending multi-month plan, start it NOW along with the batch
                    if (subData.status === 'pending') {
                        // Calculate end date based on duration
                        const start = new Date(input.startDate);
                        const end = new Date(start);
                        end.setMonth(start.getMonth() + subData.duration_months);
                        updatedEndDate = end.toISOString().split('T')[0];

                        await supabase
                            .from('subscriptions')
                            .update({
                                status: 'active',
                                start_date: input.startDate,
                                end_date: updatedEndDate
                            })
                            .eq('id', subData.id);
                    }

                    // Enroll them in the incoming batch
                    await supabase
                        .from('batch_enrollments')
                        .insert({
                            batch_id: batch.id,
                            student_id: waitlistEntry.student_id,
                            subscription_id: waitlistEntry.subscription_id,
                            status: 'active',
                            effective_end_date: updatedEndDate
                        });

                    // Terminate them from the queue
                    await supabase
                        .from('waiting_queue')
                        .update({ status: 'assigned' })
                        .eq('id', waitlistEntry.id);

                    enrolledCount++;
                }
            }
        }

        // Final Update to batch reflecting real enrolled volume
        await supabase
            .from('batches')
            .update({ current_students: enrolledCount })
            .eq('id', batch.id);

        revalidatePath('/instructor/groups');
        return { success: true, batchId: batch.id, enrolled: enrolledCount };

    } catch (err: any) {
        console.error("Batch Rollover Action Failed:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Retrieves all batches created by or assigned to a specific instructor.
 */
export async function getInstructorBatches(instructorId: string) {
    const adminClient = createAdminClient();

    // Check if user is master instructor or staff (sees all batches)
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
                student_id,
                student: profiles!batch_enrollments_student_id_fkey(id, full_name, avatar_url)
            )
        `);

    if (!seesAll) {
        query = query.eq('instructor_id', instructorId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Fetch batches error:', error);
        return [];
    }

    return data || [];
}

/**
 * Retrieves the active batch enrollment for a specific student.
 */
export async function getStudentBatchEnrollment(studentId: string) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('batch_enrollments')
        .select(`
            *,
            batch: batches(
                *,
                instructor: profiles!batches_instructor_id_fkey(full_name, avatar_url)
            )
            `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .single();

    if (error) {
        console.error('Fetch enrollment error:', error);
        return null;
    }

    return data;
}
