'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export interface JourneyLog {
    id: string;
    student_id: string;
    day_number: number;
    notes: string | null;
    photo_url: string | null;
    created_at: string;
    updated_at: string;
}

export async function getJourneyLogs(studentId: string): Promise<JourneyLog[]> {
    const admin = createAdminClient();
    const { data, error } = await admin
        .from('journey_logs')
        .select('*')
        .eq('student_id', studentId)
        .order('day_number', { ascending: true });

    if (error) {
        console.error('Error fetching journey logs:', error);
        return [];
    }

    return data || [];
}

export async function saveDailyCheckIn(
    studentId: string,
    dayNumber: number,
    notes: string | null,
    photoBase64: string | null,
    photoMimeType: string | null = 'image/jpeg'
): Promise<{ success: boolean; error?: string; data?: JourneyLog }> {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Basic authorization: must be the student themselves
    if (!user || user.id !== studentId) {
        return { success: false, error: 'Unauthorized to save this journey log.' };
    }

    let finalPhotoUrl: string | undefined = undefined;

    // 1. Upload photo if provided
    if (photoBase64) {
        try {
            const buffer = Buffer.from(photoBase64, 'base64');
            const fileExt = photoMimeType?.split('/')[1] || 'jpeg';
            const fileName = `${studentId}/day_${dayNumber}_${uuidv4()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('journey-photos')
                .upload(fileName, buffer, {
                    contentType: photoMimeType || 'image/jpeg',
                    upsert: false,
                });

            if (uploadError) {
                console.error('Upload error in journey logs:', uploadError);
                return { success: false, error: 'Failed to upload journey photo.' };
            }

            const { data: urlData } = supabase.storage
                .from('journey-photos')
                .getPublicUrl(fileName);

            finalPhotoUrl = urlData.publicUrl;
        } catch (e) {
            console.error('Photo processing error:', e);
            return { success: false, error: 'Failed to process photo.' };
        }
    }

    // 2. Upsert the log for this student and day
    // Check if a log already exists
    const { data: existingLog } = await supabase
        .from('journey_logs')
        .select('id, photo_url')
        .eq('student_id', studentId)
        .eq('day_number', dayNumber)
        .single();

    const payLoad: any = {
        student_id: studentId,
        day_number: dayNumber,
        updated_at: new Date().toISOString(),
    };

    if (notes !== null) {
        payLoad.notes = notes;
    }

    if (finalPhotoUrl) {
        payLoad.photo_url = finalPhotoUrl;
    }

    let dbError = null;
    let row = null;

    if (existingLog) {
        // Keep existing photo if a new one wasn't uploaded
        if (!finalPhotoUrl && !Object.keys(payLoad).includes('photo_url')) {
            // do nothing to photo
        }

        const { data: updated, error: e } = await supabase
            .from('journey_logs')
            .update(payLoad)
            .eq('id', existingLog.id)
            .select()
            .single();

        dbError = e;
        row = updated;
    } else {
        const { data: inserted, error: e } = await supabase
            .from('journey_logs')
            .insert(payLoad)
            .select()
            .single();

        dbError = e;
        row = inserted;
    }

    if (dbError) {
        console.error('Database save error:', dbError);
        return { success: false, error: 'Failed to save check-in data to the database.' };
    }

    revalidatePath('/student/one-on-one');
    return { success: true, data: row as JourneyLog };
}
