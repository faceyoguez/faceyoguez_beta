import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const playlistId = 'PLuQlxisy_ZcR1e8Act9nKfC6YtY5rZ_Zt';
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    
    const response = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = await response.text();
    
    // Extract ytInitialData
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || 
                  html.match(/window\["ytInitialData"\] = ({.*?});/s) ||
                  html.match(/ytInitialData[ =]+({.*?});?<\/script>/s);
                  
    if (!match) {
      throw new Error('Could not find ytInitialData in page');
    }
    
    const data = JSON.parse(match[1]);
    const items = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents || [];
    
    const videos = items.filter((item: any) => item.playlistVideoRenderer).map((item: any) => {
      const vid = item.playlistVideoRenderer;
      return {
        id: vid.videoId,
        title: vid.title?.runs?.[0]?.text,
        url: `https://www.youtube.com/watch?v=${vid.videoId}`,
        thumbnail: vid.thumbnail?.thumbnails?.[vid.thumbnail?.thumbnails?.length - 1]?.url,
        author: vid.shortBylineText?.runs?.[0]?.text
      };
    }).slice(0, 20);

    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error('Error fetching youtube playlist:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


