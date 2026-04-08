export async function createCalendarEvent({
  title,
  description,
  startDateTime,
  endDateTime,
  attendeeEmails,
  zoomLink
}: {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  attendeeEmails: string[];
  zoomLink: string;
}) {
  // Call to the internal/connected Google Stitch MCP proxy interface that handles OAuth natively.
  console.log('Sending calendar event to Google Stitch MCP...', { title, startDateTime, endDateTime });
  
  // Simulated or proxy fetch to the MCP interface handling this server-side
  const response = await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/mcp/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'createEvent',
      payload: {
        summary: title,
        description: `${description}\n\nJoin Zoom Meeting:\n${zoomLink}`,
        start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
        end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
        attendees: attendeeEmails.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 15 }
          ]
        },
        sendUpdates: 'all'
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to communicate with Google Stitch MCP Calendar Service');
  }

  const event = await response.json();
  return event; // returns event object including id
}

export function buildGoogleCalendarLink({
  title,
  startDateTime,
  endDateTime,
  description,
  location
}: {
  title: string;
  startDateTime: string;
  endDateTime: string;
  description: string;
  location: string;
}) {
  // Google Calendar format requires YYYYMMDDTHHMMSSZ
  const formatDate = (isoString: string) => {
    return new Date(isoString).toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const dates = `${formatDate(startDateTime)}/${formatDate(endDateTime)}`;
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: dates,
    details: description,
    location: location,
    ctz: 'Asia/Kolkata'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
