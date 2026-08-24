-- The `broadcasts` table was originally created directly in the Supabase
-- dashboard (never captured in a tracked migration), and its INSERT policy
-- is blocking staff/instructor/admin/client_management from sending
-- broadcasts: "new row violates row level security policy for table
-- broadcasts". RLS policies are permissive by default (OR'd together), so
-- adding this policy fixes the insert regardless of what the existing
-- (untracked) policy actually checks, as long as it isn't a RESTRICTIVE
-- policy — same role-check pattern already used for coupons
-- (20260404141835_create_coupons_table.sql).

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can send broadcasts" ON public.broadcasts;

CREATE POLICY "Staff can send broadcasts" ON public.broadcasts
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'instructor', 'client_management')
    )
  );
