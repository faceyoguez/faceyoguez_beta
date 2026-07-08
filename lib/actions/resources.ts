'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import type { StudentResource } from '@/types/database';

export async function uploadResource(
    studentId: string,
    fileName: string,
    contentType: string,
    size: number,
    base64Data: string
): Promise<{ success: boolean; data?: StudentResource; error?: string }> {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Ensure they are an instructor, admin, or staff
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile?.role || !['instructor', 'admin', 'staff', 'client_management'].includes(profile.role)) {
        return { success: false, error: 'Only instructors, staff, or admins can upload resources' };
    }

    try {
        // 1. Convert base64 back to buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // 2. Upload to storage bucket
        const fileExt = fileName.split('.').pop();
        const uniqueFileName = `${studentId}/${uuidv4()}.${fileExt}`;

        const admin = createAdminClient();

        const { data: uploadData, error: uploadError } = await admin.storage
            .from('resources')
            .upload(uniqueFileName, buffer, {
                contentType,
                upsert: false,
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return { success: false, error: 'Failed to upload file to storage.' };
        }

        // 3. Get the public URL
        const { data: publicUrlData } = admin.storage
            .from('resources')
            .getPublicUrl(uniqueFileName);

        const { data: resourceRow, error: dbError } = await admin
            .from('student_resources')
            .insert({
                student_id: studentId,
                instructor_id: user.id,
                file_name: fileName,
                file_url: publicUrlData.publicUrl,
                file_size: size,
                content_type: contentType,
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database insert error:', dbError.message, dbError.details, dbError.hint);
            // Attempt to clean up the file if DB insert fails
            await admin.storage.from('resources').remove([uniqueFileName]);
            return { success: false, error: `Failed to save resource record: ${dbError.message}` };
        }

        return { success: true, data: resourceRow };
    } catch (error) {
        console.error('Upload resource error:', error);
        return { success: false, error: 'An unexpected error occurred during upload.' };
    }
}

export async function getStudentResources(studentId: string): Promise<StudentResource[]> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Authorize caller: student themselves, or instructor/staff/admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile) return [];

    const isAuthorized = user.id === studentId || ['instructor', 'admin', 'staff', 'client_management'].includes(profile.role);
    if (!isAuthorized) return [];

    const admin = createAdminClient();
    const { data, error } = await admin
        .from('student_resources')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Fetch resources error:', error);
        return [];
    }

    return data || [];
}

export async function uploadBatchResource(
    batchId: string,
    fileName: string,
    contentType: string,
    size: number,
    base64Data: string
) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        const buffer = Buffer.from(base64Data, 'base64');
        const fileExt = fileName.split('.').pop();
        const uniqueFileName = `batches/${batchId}/${uuidv4()}.${fileExt}`;

        const admin = createAdminClient();

        const { error: uploadError } = await admin.storage
            .from('resources')
            .upload(uniqueFileName, buffer, { contentType, upsert: false });

        if (uploadError) return { success: false, error: 'Failed to upload file to storage.' };

        const { data: publicUrlData } = admin.storage
            .from('resources')
            .getPublicUrl(uniqueFileName);

        const { data: resourceRow, error: dbError } = await admin
            .from('batch_resources')
            .insert({
                batch_id: batchId,
                uploader_id: user.id,
                title: fileName,
                file_url: publicUrlData.publicUrl,
            })
            .select()
            .single();

        if (dbError) {
            await admin.storage.from('resources').remove([uniqueFileName]);
            return { success: false, error: 'Failed to save resource record.' };
        }

        return { success: true, data: resourceRow };
    } catch (error) {
        return { success: false, error: 'Unexpected error occurred.' };
    }
}

export async function getBatchResources(batchId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Authorize caller: instructor/staff/admin, or a student actively enrolled in this batch
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile) return [];

    let isAuthorized = ['instructor', 'admin', 'staff', 'client_management'].includes(profile.role);

    if (!isAuthorized) {
        const { data: enrollment } = await supabase
            .from('batch_enrollments')
            .select('batch_id')
            .eq('student_id', user.id)
            .eq('batch_id', batchId)
            .in('status', ['active', 'extended'])
            .maybeSingle();

        isAuthorized = !!enrollment;
    }

    if (!isAuthorized) return [];

    const admin = createAdminClient();
    const { data, error } = await admin
        .from('batch_resources')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
}
