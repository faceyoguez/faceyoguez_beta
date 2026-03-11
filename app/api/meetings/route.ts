import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createZoomMeeting } from '@/lib/zoom';
import { saveMeetingToDb } from '@/lib/actions/meetings';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Instructors and Admins can create meetings
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      topic,
      startTime,
      durationMinutes,
      meetingType,
      studentId,
      batchId
    } = body;

    // 1. Create Zoom Meeting via API
    const zoomResult = await createZoomMeeting({
      topic,
      startTime,
      durationMinutes,
    });

    // 2. Save it to our database
    const meetingRecord = await saveMeetingToDb({
      host_id: user.id,
      student_id: studentId || null,
      batch_id: batchId || null,
      zoom_meeting_id: zoomResult.id.toString(),
      topic: zoomResult.topic,
      start_time: zoomResult.start_time,
      duration_minutes: zoomResult.duration,
      join_url: zoomResult.join_url,
      start_url: zoomResult.start_url,
      meeting_type: meetingType,
    });

    // Purge the Next.js cache so the client instantly gets the newly scheduled meeting
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, meeting: meetingRecord });

  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
