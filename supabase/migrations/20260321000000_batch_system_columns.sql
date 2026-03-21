-- Add missing columns to batches table
ALTER TABLE public.batches
    ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 30,
    ADD COLUMN IF NOT EXISTS current_students INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_chat_enabled BOOLEAN DEFAULT true;

-- Add missing columns to batch_enrollments table
ALTER TABLE public.batch_enrollments
    ADD COLUMN IF NOT EXISTS is_trial_access BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS effective_end_date DATE,
    ADD COLUMN IF NOT EXISTS original_sub_end_date DATE,
    ADD COLUMN IF NOT EXISTS is_extended BOOLEAN DEFAULT false;

-- Add missing column to waiting_queue if it exists
ALTER TABLE public.waiting_queue
    ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now();

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_is_trial_access ON public.batch_enrollments(is_trial_access);
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_student_id ON public.batch_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_student_id ON public.waiting_queue(student_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_status ON public.waiting_queue(status);
