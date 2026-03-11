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

  const payload = {
    topic: options.topic,
    type: 2, // 2 = Scheduled meeting
    start_time: options.startTime,
    duration: options.durationMinutes,
    timezone: 'UTC',
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      waiting_room: true,
      mute_upon_entry: true,
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

  return response.json();
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
