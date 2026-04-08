const BASE = 'https://graph.facebook.com/v19.0';

const getAccessToken = () => process.env.META_ACCESS_TOKEN;
const getPixelId = () => process.env.META_PIXEL_ID;
const getInstagramId = () => process.env.META_INSTAGRAM_ID;

export async function getPixelStats(since: string, until: string) {
  const token = getAccessToken();
  const pixelId = getPixelId();
  if (!token || !pixelId) return null;

  const url = `${BASE}/${pixelId}/stats?start_time=${since}&end_time=${until}&access_token=${token}`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`Meta API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Pixel Stats:', error);
    return null;
  }
}

export async function getInstagramInsights(metric: string, period: string) {
  const token = getAccessToken();
  const igId = getInstagramId();
  if (!token || !igId) return null;

  const url = `${BASE}/${igId}/insights?metric=${metric}&period=${period}&access_token=${token}`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`Meta API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch IG Insights:', error);
    return null;
  }
}

export async function getFollowerCount() {
  const token = getAccessToken();
  const igId = getInstagramId();
  if (!token || !igId) return null;

  const url = `${BASE}/${igId}?fields=followers_count,media_count,profile_views&access_token=${token}`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`Meta API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Follower Count:', error);
    return null;
  }
}

export async function getPostInsights() {
  const token = getAccessToken();
  const igId = getInstagramId();
  if (!token || !igId) return null;

  const url = `${BASE}/${igId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,insights.metric(reach,impressions,engagement)&access_token=${token}`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`Meta API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Post Insights:', error);
    return null;
  }
}

export async function getConversionEvents(since: string, until: string) {
  const token = getAccessToken();
  const pixelId = getPixelId();
  if (!token || !pixelId) return null;

  const url = `${BASE}/${pixelId}/stats?start_time=${since}&end_time=${until}&aggregation=event&access_token=${token}`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`Meta API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Conversion Events:', error);
    return null;
  }
}
