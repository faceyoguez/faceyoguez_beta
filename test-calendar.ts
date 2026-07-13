try {
  const payload = {
    topic: "Test Topic",
    join_url: "https://zoom.us/j/123",
    start_time: "2026-07-13T14:02:00+00:00",
    duration_minutes: 45
  };
  const dateObj = new Date(payload.start_time);
  const calendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(payload.topic)}&details=${encodeURIComponent('Face Yoga 1-on-1 Session')}&location=${encodeURIComponent(payload.join_url)}&dates=${dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '')}/${new Date(dateObj.getTime() + payload.duration_minutes * 60000).toISOString().replace(/-|:|\.\d\d\d/g, '')}`;
  console.log("Calendar link generated:", calendarLink);
} catch (err) {
  console.error("Error:", err);
}
