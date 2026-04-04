CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  discount_percentage numeric NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  course_type text NOT NULL DEFAULT 'all',
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT coupons_pkey PRIMARY KEY (id),
  CONSTRAINT coupons_code_key UNIQUE (code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'instructor', 'client_management')
    )
  );

-- Enable replica identity
ALTER TABLE public.coupons REPLICA IDENTITY FULL;
