const ZOOM_OAUTH_ENDPOINT = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getZoomToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom credentials are not configured in environment variables.');
  }

  const tokenUrl = `${ZOOM_OAUTH_ENDPOINT}?grant_type=account_credentials&account_id=${accountId}`;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
    },
    // Server-to-Server doesn't strictly need a body, but next.js fetch might complain if empty on POST sometimes. 
    // It's safe to just send an empty body or omit it entirely since query params satisfy the requirement.
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to get Zoom token:', errorData);
    throw new Error(`Failed to get Zoom token: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Subtract 5 minutes (300 seconds) from expiry to ensure we refresh before it's actually invalid
  tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

  return cachedToken!;
}

export interface ZoomMeetingOptions {
  topic: string;
  startTime: string; // ISO 8601 string e.g. "2024-03-24T18:00:00Z"
  durationMinutes: number;
}

export interface ZoomMeetingResult {
  id: number;
  topic: string;
  start_url: string; // For host
  join_url: string;  // For participants
  start_time: string;
  duration: number;
  password?: string;
}

export async function createZoomMeeting(options: ZoomMeetingOptions): Promise<ZoomMeetingResult> {
  const token = await getZoomToken();
  const hostEmail = process.env.ZOOM_HOST_EMAIL;

  if (!hostEmail) {
    throw new Error('ZOOM_HOST_EMAIL is not configured in environment variables.');
  }

  const url = `${ZOOM_API_BASE}/users/${hostEmail}/meetings`;

  // Zoom API: when timezone is set, start_time must be sent WITHOUT a UTC offset (no Z).
  // It should be the LOCAL time in that timezone.
  // The incoming startTime is always a UTC ISO string (from .toISOString()).
  // We convert UTC → IST by adding 5h30m, then strip the Z so Zoom reads it as IST local.
  const utcDate = new Date(options.startTime);
  // Add IST offset: +5:30 = 330 minutes
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(utcDate.getTime() + istOffsetMs);
  // Format as 'YYYY-MM-DDTHH:mm:ss' (no Z, no offset) — Zoom will read this as IST
  const istLocalString = istDate.toISOString().replace('Z', '').split('.')[0];

  const payload = {
    topic: options.topic,
    type: 2, // 2 = Scheduled meeting
    start_time: istLocalString,
    duration: options.durationMinutes,
    timezone: 'Asia/Calcutta',
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      waiting_room: true,
      mute_upon_entry: true,
      auto_recording: 'cloud',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to create Zoom meeting:', errorData);
    throw new Error(`Failed to create Zoom meeting (Status ${response.status}): ${errorData}`);
  }

  const result = await response.json();

  // Zoom returns start_time as IST local (no offset) when timezone is Asia/Calcutta.
  // We convert it back to UTC for consistent storage in our database.
  // If it already has a Z or +offset, new Date() handles it correctly.
  if (result.start_time && !result.start_time.includes('Z') && !result.start_time.includes('+')) {
    // It's a local IST time — subtract 5h30m to get UTC
    const returnedIst = new Date(result.start_time + 'Z'); // parse as UTC momentarily
    const correctedUtc = new Date(returnedIst.getTime() - istOffsetMs);
    result.start_time = correctedUtc.toISOString();
  }

  return result;
}

export interface ZoomRecordingFile {
  id: string;
  file_type: string;
  file_size: number;
  play_url: string;
  download_url: string;
  status: 'completed' | 'processing';
  recording_start: string;
  recording_end: string;
  recording_type: string;
}

export interface ZoomMeetingRecordings {
  uuid: string;
  id: number;
  topic: string;
  start_time: string;
  duration: number;
  recording_files: ZoomRecordingFile[];
}

/**
 * Fetch cloud recordings for a specific Zoom meeting.
 * Returns null if the meeting has no recording yet (404) or on error.
 * Response is cached for 5 minutes to avoid hammering the Zoom API.
 */
export async function getZoomMeetingRecordings(
  meetingId: string
): Promise<ZoomMeetingRecordings | null> {
  try {
    const token = await getZoomToken();
    const url = `${ZOOM_API_BASE}/meetings/${meetingId}/recordings`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }, // Cache for 5 minutes server-side
    });

    if (!response.ok) return null; // 404 = no recording yet; any error → null
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Fetch a ZAK (Zoom Access Key) token for the account's host user.
 * Required by the Meeting SDK for a host to start a meeting embedded in the browser
 * without ever logging into Zoom.
 */
export async function getZoomZakToken(): Promise<string> {
  const token = await getZoomToken();
  const hostEmail = process.env.ZOOM_HOST_EMAIL;

  if (!hostEmail) {
    throw new Error('ZOOM_HOST_EMAIL is not configured in environment variables.');
  }

  const url = `${ZOOM_API_BASE}/users/${hostEmail}/token?type=zak`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to get Zoom ZAK token:', errorData);
    throw new Error(`Failed to get Zoom ZAK token: ${response.status}`);
  }

  const data = await response.json();
  return data.token;
}

export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  const token = await getZoomToken();

  const url = `${ZOOM_API_BASE}/meetings/${meetingId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.text();
    console.error(`Failed to delete Zoom meeting ${meetingId}:`, errorData);
    throw new Error(`Failed to delete Zoom meeting: ${response.status}`);
  }
}
