import { NextResponse } from 'next/server';
import {
  getFollowerCount,
  getInstagramInsights,
  getPostInsights,
  getConversionEvents,
} from '@/lib/metaAnalytics';

export async function GET() {
  try {
    // Calculate 7 days ago in Unix seconds
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - 7 * 24 * 60 * 60;

    const [followers, insights, posts, conversions] = await Promise.all([
      getFollowerCount(),
      getInstagramInsights('reach,impressions,profile_views', 'day'),
      getPostInsights(),
      getConversionEvents(sevenDaysAgo.toString(), now.toString()),
    ]);

    return NextResponse.json({
      followers,
      insights,
      posts,
      conversions,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Meta analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Meta analytics', detail: error.message },
      { status: 500 }
    );
  }
}
