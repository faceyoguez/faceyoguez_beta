-- ════════════════════════════════════════════════════════════════
--  CONSULTATION FEATURE — DATABASE MIGRATION
--  Run this in Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

-- 1. CONSULTATIONS
CREATE TABLE IF NOT EXISTS public.consultations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_id        TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  amount            INTEGER NOT NULL DEFAULT 999,
  currency          TEXT NOT NULL DEFAULT 'INR',
  status            TEXT NOT NULL DEFAULT 'paid'
    CHECK (status IN ('paid', 'active', 'completed', 'cancelled')),
  credit_applied    BOOLEAN NOT NULL DEFAULT false,
  credit_applied_at TIMESTAMPTZ,
  credit_subscription_id UUID,
  paid_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at      TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CONSULTATION MESSAGES
CREATE TABLE IF NOT EXISTS public.consultation_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id  UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content          TEXT,
  content_type     TEXT NOT NULL DEFAULT 'text'
    CHECK (content_type IN ('text', 'pdf', 'image', 'file', 'system')),
  file_url         TEXT,
  file_name        TEXT,
  file_size        INTEGER,
  is_read          BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CONSULTATION ZOOM CALLS
CREATE TABLE IF NOT EXISTS public.consultation_zoom_calls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id   UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  zoom_meeting_id   TEXT NOT NULL,
  topic             TEXT NOT NULL,
  join_url          TEXT NOT NULL,
  start_url         TEXT NOT NULL,
  password          TEXT,
  start_time        TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 30,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultations_student_id ON public.consultations(student_id);
CREATE INDEX IF NOT EXISTS idx_consultations_staff_id ON public.consultations(staff_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_consultation_id ON public.consultation_messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_zoom_calls_consultation_id ON public.consultation_zoom_calls(consultation_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_consultation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS consultations_updated_at ON public.consultations;
CREATE TRIGGER consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.set_consultation_updated_at();

-- RLS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_zoom_calls ENABLE ROW LEVEL SECURITY;

-- Consultations policies
CREATE POLICY "consultations_select" ON public.consultations FOR SELECT USING (
  auth.uid() = student_id OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff','admin','instructor','client_management')
);
CREATE POLICY "consultations_insert" ON public.consultations FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "consultations_update" ON public.consultations FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff','admin','instructor','client_management')
  OR auth.uid() = student_id
);

-- Messages policies
CREATE POLICY "consultation_messages_select" ON public.consultation_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.consultations c WHERE c.id = consultation_id
    AND (c.student_id = auth.uid() OR c.staff_id = auth.uid()
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff','admin','instructor','client_management'))
  )
);
CREATE POLICY "consultation_messages_insert" ON public.consultation_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.consultations c WHERE c.id = consultation_id
    AND (c.student_id = auth.uid() OR c.staff_id = auth.uid()
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff','admin','instructor','client_management'))
  )
);
CREATE POLICY "consultation_messages_update" ON public.consultation_messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Zoom calls policies
CREATE POLICY "consultation_zoom_select" ON public.consultation_zoom_calls FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.consultations c WHERE c.id = consultation_id
    AND (c.student_id = auth.uid() OR c.staff_id = auth.uid()
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff','admin','instructor','client_management'))
  )
);
CREATE POLICY "consultation_zoom_insert" ON public.consultation_zoom_calls FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff','admin','instructor','client_management')
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
