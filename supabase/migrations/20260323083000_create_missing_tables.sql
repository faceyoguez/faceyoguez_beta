-- Migration to create missing tables: journey_logs and student_resources

CREATE TABLE IF NOT EXISTS public.student_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  instructor_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size numeric NOT NULL,
  content_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT student_resources_pkey PRIMARY KEY (id),
  CONSTRAINT student_resources_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id),
  CONSTRAINT student_resources_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.journey_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  day_number integer NOT NULL,
  notes text,
  photo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT journey_logs_pkey PRIMARY KEY (id),
  CONSTRAINT journey_logs_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.student_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_logs ENABLE ROW LEVEL SECURITY;

-- Policies for student_resources
CREATE POLICY "Users can view their own resources" ON public.student_resources
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = instructor_id);

CREATE POLICY "Instructors can insert resources" ON public.student_resources
  FOR INSERT WITH CHECK (auth.uid() = instructor_id);

-- Policies for journey_logs
CREATE POLICY "Students can manage their own journey logs" ON public.journey_logs
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view student journey logs" ON public.journey_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE subscriptions.student_id = journey_logs.student_id
      AND subscriptions.assigned_instructor_id = auth.uid()
    )
  );

-- Enable replica identity for realtime
ALTER TABLE public.student_resources REPLICA IDENTITY FULL;
ALTER TABLE public.journey_logs REPLICA IDENTITY FULL;
