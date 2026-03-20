-- LMS Tables for Face Yoga Platform

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    level TEXT CHECK (level IN ('Level 1', 'Level 2', 'Level 3', 'Masterclass')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Modules Table (Chapters)
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, order_index)
);

-- 3. Lessons Table (Videos)
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    video_url TEXT NOT NULL, -- Full YouTube URL or ID
    youtube_id TEXT, -- Extracted YouTube ID
    content TEXT, -- Markdown or HTML description
    is_free_preview BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(module_id, order_index)
);

-- 4. User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    progress_percent INTEGER DEFAULT 0, -- 0-100
    UNIQUE(user_id, lesson_id)
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Helper View for Course Details
CREATE OR REPLACE VIEW v_course_structure AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    m.id as module_id,
    m.title as module_title,
    m.order_index as module_order,
    l.id as lesson_id,
    l.title as lesson_title,
    l.video_url,
    l.youtube_id,
    l.order_index as lesson_order,
    l.is_free_preview
FROM courses c
JOIN modules m ON c.id = m.course_id
JOIN lessons l ON m.id = l.module_id
ORDER BY m.order_index, l.order_index;
