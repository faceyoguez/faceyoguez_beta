import { NextResponse } from 'next/server';
import { getWebinarWhatsAppLink } from '@/lib/actions/webinar';

// Cache for 30 seconds — short enough to reflect updates, long enough to avoid hammering DB
export const revalidate = 30;

export async function GET() {
  const link = await getWebinarWhatsAppLink();
  return NextResponse.json({ link: link ?? null }, { status: 200 });
}
