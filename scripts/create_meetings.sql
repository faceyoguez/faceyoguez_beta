-- Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id uuid REFERENCES public.profiles(id) NOT NULL,
  student_id uuid REFERENCES public.profiles(id),
  batch_id uuid REFERENCES public.batches(id),
  zoom_meeting_id text NOT NULL,
  topic text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL,
  join_url text NOT NULL,
  start_url text NOT NULL,
  meeting_type text CHECK (meeting_type IN ('one_on_one', 'group_session')) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Admins and Instructors can view all meetings
CREATE POLICY "Instructors and Admins can view all meetings" 
ON public.meetings FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor', 'staff')
  )
);

-- Instructors and Admins can insert/update/delete all meetings
CREATE POLICY "Instructors and Admins can manage meetings" 
ON public.meetings FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor', 'staff')
  )
);

-- Students can view their specific 1-on-1 meetings
CREATE POLICY "Students can view their 1-on-1 meetings"
ON public.meetings FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
);

-- Students can view meetings for batches they are enrolled in
CREATE POLICY "Students can view their batch meetings"
ON public.meetings FOR SELECT
TO authenticated
USING (
  meeting_type = 'group_session' AND
  EXISTS (
    SELECT 1 FROM public.batch_enrollments
    WHERE batch_enrollments.batch_id = meetings.batch_id
    AND batch_enrollments.student_id = auth.uid()
    AND batch_enrollments.status = 'active'
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION set_current_timestamp_updated_at();
