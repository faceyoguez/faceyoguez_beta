import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedLMS() {
    console.log('🌱 Starting LMS Seeding...');

    // 1. Diagnostic Check
    const { error: checkError } = await supabase.from('courses').select('id').limit(1);
    if (checkError) {
        console.error('❌ Table "courses" check failed:', checkError.message);
        console.log('Please ensure you have run the SQL migration in Supabase.');
        return;
    }
    console.log('✅ Database tables verified.');

    // 2. Create Course
    const courseData = {
        title: 'Face Yoga 21-Day Transformation',
        slug: '21-day-transformation',
        description: 'The Glow-Up Your Skin Has Been Waiting For. Ancient muscle movement meets modern glow science.',
        level: 'Level 1',
        thumbnail_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
        is_active: true
    };

    const { data: course, error: courseError } = await supabase
        .from('courses')
        .upsert(courseData, { onConflict: 'slug' })
        .select()
        .single();

    if (courseError) {
        console.error('Course Error:', courseError);
        return;
    }
    console.log('✅ Course created/updated:', course.title);

    // 3. Create Modules
    const modules = [
        { course_id: course.id, title: 'The Foundation', order_index: 1 },
        { course_id: course.id, title: 'Sculpting & Toning', order_index: 2 },
        { course_id: course.id, title: 'Radiance Maintenance', order_index: 3 }
    ];

    const { data: createdModules, error: moduleError } = await supabase
        .from('modules')
        .upsert(modules, { onConflict: 'course_id,order_index' })
        .select();

    if (moduleError) {
        console.error('Module Error:', moduleError);
        return;
    }
    console.log('✅ Modules created/updated:', createdModules.length);

    // 4. Create Lessons
    const module1 = createdModules.find(m => m.order_index === 1)!;
    const module2 = createdModules.find(m => m.order_index === 2)!;

    const lessons = [
        {
            module_id: module1.id,
            title: 'Welcome to Your Transformation',
            slug: 'welcome',
            video_url: 'dQw4w9WgXcQ',
            youtube_id: 'dQw4w9WgXcQ',
            content: '<h2>Your Journey Begins</h2><p>Welcome to the 21-day ritual. This session covers the basics of facial muscle engagement.</p>',
            order_index: 1,
            is_free_preview: true
        },
        {
            module_id: module1.id,
            title: 'The Anatomy of Glow',
            slug: 'anatomy-of-glow',
            video_url: 'ScMzIvxBSi4',
            youtube_id: 'ScMzIvxBSi4',
            content: '<h2>Understanding Your Muscles</h2><p>Learn about the 43 muscles in your face and how they hold tension.</p>',
            order_index: 2
        },
        {
            module_id: module2.id,
            title: 'Jawline Definition Ritual',
            slug: 'jawline-ritual',
            video_url: '60ItHLz5WEA',
            youtube_id: '60ItHLz5WEA',
            content: '<h2>Sculpting the Lower Face</h2><p>A deep-dive into toning the platysma and masseter muscles.</p>',
            order_index: 1
        }
    ];

    const { error: lessonError } = await supabase
        .from('lessons')
        .upsert(lessons, { onConflict: 'module_id,order_index' });

    if (lessonError) {
        console.error('Lesson Error:', lessonError);
        return;
    }
    console.log('✅ Lessons created/updated:', lessons.length);
    console.log('🌟 Seeding Complete!');
}

seedLMS().catch(err => {
    console.error('Unhandled Seeding Error:', err);
});
