'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
}

/**
 * Scrape a public YouTube playlist and create a course in the LMS.
 */
export async function scrapeAndCreateCourse(playlistUrl: string, courseTitle: string, level: number, creatorId: string) {
  try {
    const admin = createAdminClient();

    // 1. Fetch the playlist page
    const response = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch YouTube playlist page.');
    
    const html = await response.text();
    
    // 2. Locate ytInitialData in the HTML
    const marker = 'var ytInitialData = ';
    const startIdx = html.indexOf(marker);
    if (startIdx === -1) throw new Error('Could not find playlist data in YouTube response.');
    
    const dataStart = startIdx + marker.length;
    let dataEnd = html.indexOf(';</script>', dataStart);
    if (dataEnd === -1) {
        dataEnd = html.indexOf('};', dataStart) + 1;
    }
    
    const jsonStr = html.substring(dataStart, dataEnd);
    const ytData = JSON.parse(jsonStr);

    // 3. Navigate the deep YouTube JSON structure
    // playlistVideoListRenderer -> contents -> playlistVideoRenderer
    const contents = ytData.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;

    if (!contents || !Array.isArray(contents)) {
      throw new Error('Could not parse videos from playlist data structure.');
    }

    const videos: YoutubeVideo[] = contents
      .filter((item: any) => item.playlistVideoRenderer)
      .map((item: any) => {
        const v = item.playlistVideoRenderer;
        return {
          id: v.videoId,
          title: v.title?.runs?.[0]?.text || 'Untitled Video',
          thumbnail: v.thumbnail?.thumbnails?.[0]?.url || ''
        };
      });

    if (videos.length === 0) throw new Error('No videos found in the playlist.');

    // 4. Database Transaction (Manual)
    // Create the course
    const { data: course, error: courseError } = await admin
      .from('lms_courses')
      .upsert({
        title: courseTitle,
        level: level,
        created_by: creatorId,
        thumbnail_url: videos[0].thumbnail
      })
      .select()
      .single();

    if (courseError) throw courseError;

    // Create the modules
    const modulesToInsert = videos.map((v, index) => ({
      course_id: course.id,
      title: v.title,
      youtube_video_id: v.id,
      order_index: index,
      thumbnail_url: v.thumbnail
    }));

    // Clear existing modules for this course if re-scraping (Optional, but safer for "Update")
    await admin.from('lms_modules').delete().eq('course_id', course.id);

    const { error: modulesError } = await admin
      .from('lms_modules')
      .insert(modulesToInsert);

    if (modulesError) throw modulesError;

    revalidatePath('/student/lms');
    revalidatePath('/staff/lms');
    
    return { success: true, count: videos.length };
  } catch (error: any) {
    console.error('LMS Scraper Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a module as completed by a student.
 */
export async function markModuleAsComplete(moduleId: string, studentId: string) {
  try {
    const admin = createAdminClient();

    const { error } = await admin
      .from('student_lms_progress')
      .upsert({
        student_id: studentId,
        module_id: moduleId,
        completed_at: new Date().toISOString()
      }, { onConflict: 'student_id, module_id' });

    if (error) throw error;

    revalidatePath('/student/lms');
    
    return { success: true };
  } catch (error: any) {
    console.error('LMS Progress Error:', error);
    return { success: false, error: error.message };
  }
}
