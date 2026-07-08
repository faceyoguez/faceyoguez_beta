// One-off: find and end any Zoom meeting stuck "in progress" under the app's host
// account, which blocks starting/joining new ones (errorCode 3000).
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getZoomToken } from '../lib/zoom';

async function main() {
  const token = await getZoomToken();
  const hostEmail = process.env.ZOOM_HOST_EMAIL!;

  const res = await fetch(`https://api.zoom.us/v2/users/${hostEmail}/meetings?type=live`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  console.log('Live meetings:', JSON.stringify(data, null, 2));

  const live = data.meetings || [];
  for (const m of live) {
    console.log(`Ending meeting ${m.id} (${m.topic})...`);
    const endRes = await fetch(`https://api.zoom.us/v2/meetings/${m.id}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end' }),
    });
    console.log(`  -> status ${endRes.status}`);
  }

  if (live.length === 0) {
    console.log('No live meetings found under this host account via the live-list endpoint.');
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
