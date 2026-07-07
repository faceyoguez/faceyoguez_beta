import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure they are an instructor, admin, or staff
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['instructor', 'admin', 'staff', 'client_management'].includes(profile.role)) {
      return NextResponse.json({ error: 'Only instructors, staff, or admins can upload resources' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const studentId = formData.get('studentId') as string | null;
    const batchId = formData.get('batchId') as string | null;
    const uploadType = formData.get('type') as 'private' | 'batch' | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (uploadType === 'private' && !studentId) {
      return NextResponse.json({ error: 'studentId is required for private uploads' }, { status: 400 });
    }

    if (uploadType === 'batch' && !batchId) {
      return NextResponse.json({ error: 'batchId is required for batch uploads' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name;
    const contentType = file.type || 'application/octet-stream';
    const size = file.size;

    const fileExt = fileName.split('.').pop() || '';
    const uniqueId = uuidv4();

    const admin = createAdminClient();

    if (uploadType === 'private') {
      const uniqueFileName = `${studentId}/${uniqueId}.${fileExt}`;

      // Upload to storage bucket
      const { data: uploadData, error: uploadError } = await admin.storage
        .from('resources')
        .upload(uniqueFileName, buffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload file to storage.' }, { status: 500 });
      }

      // Get public URL
      const { data: publicUrlData } = admin.storage
        .from('resources')
        .getPublicUrl(uniqueFileName);

      // Insert database row
      const { data: resourceRow, error: dbError } = await admin
        .from('student_resources')
        .insert({
          student_id: studentId,
          instructor_id: user.id,
          file_name: fileName,
          file_url: publicUrlData.publicUrl,
          file_size: size,
          content_type: contentType,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Cleanup storage
        await admin.storage.from('resources').remove([uniqueFileName]);
        return NextResponse.json({ error: `Failed to save resource record: ${dbError.message}` }, { status: 500 });
      }

      revalidatePath(`/student/one-on-one`);
      return NextResponse.json({ success: true, data: resourceRow });
    } else {
      const uniqueFileName = `batches/${batchId}/${uniqueId}.${fileExt}`;

      // Upload to storage bucket
      const { data: uploadData, error: uploadError } = await admin.storage
        .from('resources')
        .upload(uniqueFileName, buffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload file to storage.' }, { status: 500 });
      }

      // Get public URL
      const { data: publicUrlData } = admin.storage
        .from('resources')
        .getPublicUrl(uniqueFileName);

      // Insert database row (batch_resources has 'title' and 'file_url')
      const { data: resourceRow, error: dbError } = await admin
        .from('batch_resources')
        .insert({
          batch_id: batchId,
          uploader_id: user.id,
          title: fileName,
          file_url: publicUrlData.publicUrl,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Cleanup storage
        await admin.storage.from('resources').remove([uniqueFileName]);
        return NextResponse.json({ error: `Failed to save resource record: ${dbError.message}` }, { status: 500 });
      }

      revalidatePath(`/student/group-session`);
      return NextResponse.json({ success: true, data: resourceRow });
    }
  } catch (error: any) {
    console.error('Upload API route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
