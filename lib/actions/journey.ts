'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export interface JourneyLog {
    id: string;
    student_id: string;
    day_number: number;
    notes: string | null;
    photo_url: string | null;        // front view
    photo_url_left: string | null;   // left side profile
    photo_url_right: string | null;  // right side profile
    created_at: string;
    updated_at: string;
}

export async function getJourneyLogs(studentId: string): Promise<JourneyLog[]> {
    const admin = createAdminClient();
    const { data, error } = await admin
        .from('journey_logs')
        .select('id, student_id, day_number, notes, photo_url, photo_url_left, photo_url_right, created_at, updated_at')
        .eq('student_id', studentId)
        .order('day_number', { ascending: true });

    if (error) {
        console.error('Error fetching journey logs:', error);
        return [];
    }

    return data || [];
}

type PhotoAngle = 'front' | 'left' | 'right';

interface AnglePhoto {
    base64: string;
    mimeType: string;
}

async function uploadAnglePhoto(
    supabase: any,
    studentId: string,
    dayNumber: number,
    angle: PhotoAngle,
    base64: string,
    mimeType: string
): Promise<string | null> {
    try {
        const buffer = Buffer.from(base64, 'base64');
        const fileExt = mimeType.split('/')[1] || 'jpeg';
        const fileName = `${studentId}/day_${dayNumber}_${angle}_${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('journey-photos')
            .upload(fileName, buffer, { contentType: mimeType, upsert: false });

        if (uploadError) {
            console.error(`Upload error [${angle}]:`, uploadError);
            return null;
        }

        const { data: urlData } = supabase.storage
            .from('journey-photos')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    } catch (e) {
        console.error(`Photo processing error [${angle}]:`, e);
        return null;
    }
}

export async function saveDailyCheckIn(
    studentId: string,
    dayNumber: number,
    notes: string | null,
    // Legacy single-photo param (kept for backward compat) — treated as "front"
    photoBase64?: string | null,
    photoMimeType?: string | null,
    // New multi-angle params
    photos?: {
        front?: AnglePhoto | null;
        left?: AnglePhoto | null;
        right?: AnglePhoto | null;
    }
): Promise<{ success: boolean; error?: string; data?: JourneyLog }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== studentId) {
        return { success: false, error: 'Unauthorized to save this journey log.' };
    }

    // Resolve photo sources — new multi-angle params take priority
    const frontB64  = photos?.front?.base64  ?? photoBase64  ?? null;
    const frontMime = photos?.front?.mimeType ?? photoMimeType ?? 'image/jpeg';
    const leftB64   = photos?.left?.base64   ?? null;
    const leftMime  = photos?.left?.mimeType ?? 'image/jpeg';
    const rightB64  = photos?.right?.base64  ?? null;
    const rightMime = photos?.right?.mimeType ?? 'image/jpeg';

    // Upload all provided angles in parallel
    const [frontUrl, leftUrl, rightUrl] = await Promise.all([
        frontB64  ? uploadAnglePhoto(supabase, studentId, dayNumber, 'front', frontB64, frontMime!)  : Promise.resolve(null),
        leftB64   ? uploadAnglePhoto(supabase, studentId, dayNumber, 'left',  leftB64,  leftMime!)   : Promise.resolve(null),
        rightB64  ? uploadAnglePhoto(supabase, studentId, dayNumber, 'right', rightB64, rightMime!)  : Promise.resolve(null),
    ]);

    const payload: any = {
        student_id: studentId,
        day_number: dayNumber,
        updated_at: new Date().toISOString(),
    };

    if (notes !== null) payload.notes = notes;
    if (frontUrl)        payload.photo_url       = frontUrl;
    if (leftUrl)         payload.photo_url_left  = leftUrl;
    if (rightUrl)        payload.photo_url_right = rightUrl;

    const { data: row, error: dbError } = await supabase
        .from('journey_logs')
        .upsert(payload, { onConflict: 'student_id,day_number' })
        .select()
        .single();

    if (dbError) {
        console.error('Database save error:', dbError);
        return { success: false, error: 'Failed to save check-in data to the database.' };
    }

    revalidatePath('/student/one-on-one');
    revalidatePath('/student/group-session');
    return { success: true, data: row as JourneyLog };
}
