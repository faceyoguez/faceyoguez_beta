// Read-only: list any Zoom meeting currently "in progress" under the app's host account.
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
  console.log('Live meetings under host account:', JSON.stringify(data, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
