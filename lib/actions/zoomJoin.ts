'use server';

import crypto from 'crypto';
import { createServerSupabaseClient, createAdminClient } from '../supabase/server';
import { getZoomZakToken } from '../zoom';
import { STAFF_ROLES } from '../../types/database';

export interface ZoomJoinContext {
  sdkKey: string;
  signature: string;
  zak?: string;
  meetingNumber: string;
  password: string | null;
  userName: string;
  isHost: boolean;
  topic: string;
  sessionKind: 'group' | 'one_on_one';
}

function generateSdkSignature(meetingNumber: string, role: 0 | 1): string {
  const sdkKey = process.env.ZOOM_SDK_CLIENT_ID;
  const sdkSecret = process.env.ZOOM_SDK_CLIENT_SECRET;

  if (!sdkKey || !sdkSecret) {
    throw new Error('Zoom Meeting SDK credentials (ZOOM_SDK_CLIENT_ID / ZOOM_SDK_CLIENT_SECRET) are not configured.');
  }

  const iat = Math.round(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2; // 2 hours

  const header = { alg: 'HS256', typ: 'JWT' };
  // Without cross-origin isolation (COOP/COEP headers, which we don't set — they'd
  // risk breaking other embedded iframes like Razorpay checkout), the SDK has no
  // SharedArrayBuffer and silently disables Gallery View unless told to fall back
  // to plain WebRTC instead of its WASM video pipeline.
  const payload = { appKey: sdkKey, mn: meetingNumber, role, iat, exp, tokenExp: exp, video_webrtc_mode: 1 };

  const b64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${b64(header)}.${b64(payload)}`;
  const signature = crypto.createHmac('sha256', sdkSecret).update(unsigned).digest('base64url');

  return `${unsigned}.${signature}`;
}

/**
 * Resolves everything the embedded Meeting SDK needs to join a specific meeting or
 * consultation call, and decides host vs attendee using the same authorization rules
 * already used across the group/one-on-one/consultation pages.
 */
export async function getZoomJoinContext(input: {
  meetingId: string;
  type: 'meeting' | 'consultation';
}): Promise<ZoomJoinContext> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, is_master_instructor')
    .eq('id', user.id)
    .single();
  if (!profile) throw new Error('Profile not found');

  const admin = createAdminClient();
  let zoomMeetingId: string;
  let password: string | null;
  let topic: string;
  let isHost: boolean;
  let sessionKind: 'group' | 'one_on_one';

  if (input.type === 'consultation') {
    const { data: call } = await admin
      .from('consultation_zoom_calls')
      .select('zoom_meeting_id, password, topic, consultation:consultations(student_id)')
      .eq('id', input.meetingId)
      .single();
    if (!call) throw new Error('Consultation call not found');

    const consultation = (call as any).consultation;
    const isStaffOrInstructor = STAFF_ROLES.includes(profile.role as any);
    const isAuthorized = isStaffOrInstructor || consultation?.student_id === user.id;
    if (!isAuthorized) throw new Error('Not authorized to join this call');

    zoomMeetingId = call.zoom_meeting_id;
    password = call.password;
    topic = call.topic;
    isHost = isStaffOrInstructor;
    sessionKind = 'one_on_one';
  } else {
    const { data: meeting, error: meetingError } = await admin
      .from('meetings')
      .select('zoom_meeting_id, password, topic, host_id, student_id, batch_id, meeting_type')
      .eq('id', input.meetingId)
      .single();
    if (!meeting) {
      if (meetingError) console.error('[getZoomJoinContext] meeting lookup error', meetingError);
      throw new Error('Meeting not found');
    }

    const isStaffOrInstructor = STAFF_ROLES.includes(profile.role as any);
    const isDirectStudent = meeting.student_id === user.id;

    let isEnrolledInBatch = false;
    if (!isStaffOrInstructor && !isDirectStudent && meeting.batch_id) {
      const { data: enrollment } = await supabase
        .from('batch_enrollments')
        .select('batch_id')
        .eq('student_id', user.id)
        .eq('batch_id', meeting.batch_id)
        .in('status', ['active', 'extended'])
        .maybeSingle();
      isEnrolledInBatch = !!enrollment;
    }

    if (!isStaffOrInstructor && !isDirectStudent && !isEnrolledInBatch) {
      throw new Error('Not authorized to join this meeting');
    }

    // Staff/instructor/admin always join as host, students always as attendee —
    // regardless of who literally scheduled the meeting (meeting.host_id).
    isHost = isStaffOrInstructor;
    zoomMeetingId = meeting.zoom_meeting_id;
    password = meeting.password;
    topic = meeting.topic;
    sessionKind = meeting.meeting_type === 'group_session' ? 'group' : 'one_on_one';
  }

  const signature = generateSdkSignature(zoomMeetingId, isHost ? 1 : 0);
  const zak = isHost ? await getZoomZakToken() : undefined;

  return {
    sdkKey: process.env.ZOOM_SDK_CLIENT_ID!,
    signature,
    zak,
    meetingNumber: zoomMeetingId,
    password,
    userName: profile.full_name || 'Guest',
    isHost,
    topic,
    sessionKind,
  };
}
