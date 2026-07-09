import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { getZoomMeetingRecordings, getZoomToken } from '@/lib/zoom';
import { STAFF_ROLES } from '@/types/database';

/**
 * Streams a Zoom cloud recording through our own server instead of sending
 * students to zoom.us — the video plays inside our own <video> element.
 * The Zoom access token is only ever used server-side to fetch bytes from
 * Zoom; it's never sent to the browser. Forwards the Range header so native
 * video seeking/scrubbing works against Zoom's file.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
) {
    const { meetingId } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Not authenticated', { status: 401 });

    const admin = createAdminClient();

    const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const { data: meeting } = await admin
        .from('meetings')
        .select('id, batch_id, zoom_meeting_id, meeting_type')
        .eq('id', meetingId)
        .single();

    if (!meeting || meeting.meeting_type !== 'group_session' || !meeting.batch_id) {
        return new Response('Not found', { status: 404 });
    }

    const isStaffOrInstructor = STAFF_ROLES.includes(profile?.role as any);
    let isAuthorized = isStaffOrInstructor;

    if (!isAuthorized) {
        const { data: enrollment } = await admin
            .from('batch_enrollments')
            .select('batch_id')
            .eq('student_id', user.id)
            .eq('batch_id', meeting.batch_id)
            .in('status', ['active', 'extended'])
            .maybeSingle();
        isAuthorized = !!enrollment;
    }

    if (!isAuthorized) return new Response('Forbidden', { status: 403 });

    const recordings = await getZoomMeetingRecordings(meeting.zoom_meeting_id);
    const mainFile =
        recordings?.recording_files?.find(
            (f) => f.recording_type === 'shared_screen_with_speaker_view' && f.status === 'completed'
        ) ||
        recordings?.recording_files?.find((f) => f.status === 'completed') ||
        null;

    if (!mainFile) return new Response('Recording not available', { status: 404 });

    const token = await getZoomToken();
    const rangeHeader = request.headers.get('range');

    const zoomResponse = await fetch(`${mainFile.download_url}?access_token=${token}`, {
        headers: rangeHeader ? { Range: rangeHeader } : undefined,
    });

    if (!zoomResponse.ok || !zoomResponse.body) {
        return new Response('Failed to fetch recording', { status: 502 });
    }

    const headers = new Headers();
    headers.set('Content-Type', zoomResponse.headers.get('content-type') || 'video/mp4');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'private, max-age=3600');
    const contentLength = zoomResponse.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);
    const contentRange = zoomResponse.headers.get('content-range');
    if (contentRange) headers.set('Content-Range', contentRange);

    return new Response(zoomResponse.body, { status: zoomResponse.status, headers });
}
