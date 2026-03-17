-- ============================================================
-- MIGRATION V2: Roles, Master Instructor, Trial, Instructor Assignment
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. UPDATE ROLE ENUM
-- Add new roles: client_management, sales_team, marketing_team
-- Note: PostgreSQL doesn't allow easy enum modification, so we alter the column constraint

-- First, check if the profiles table uses a CHECK constraint or enum type
-- We'll use a text column approach (most flexible) by dropping old constraint and adding new one

-- Drop the existing check constraint on role (if it exists)
DO $$
BEGIN
  -- Try to drop existing constraint
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- If using a custom enum type, alter it
DO $$
BEGIN
  -- Add new enum values if they don't exist
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'client_management';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_team';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'marketing_team';
EXCEPTION
  WHEN undefined_object THEN
    -- No enum type exists, we'll use a CHECK constraint instead
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('admin', 'instructor', 'staff', 'client_management', 'sales_team', 'marketing_team', 'student'));
END $$;

-- 2. ADD is_master_instructor FLAG TO PROFILES
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_master_instructor boolean DEFAULT false;

-- 3. ADD assigned_instructor_id TO SUBSCRIPTIONS
-- This tracks which instructor is assigned to this student's subscription
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS assigned_instructor_id uuid REFERENCES public.profiles(id);

-- 4. ADD is_trial FLAG TO SUBSCRIPTIONS
-- Trial subscriptions are free, 2-day duration
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS is_trial boolean DEFAULT false;

-- 5. ADD instructor_notes TO SUBSCRIPTIONS (for staff/instructor notes about student)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS instructor_notes text;

-- 6. UPDATE RLS POLICIES FOR MEETINGS TO INCLUDE client_management
DROP POLICY IF EXISTS "Instructors and Admins can view all meetings" ON public.meetings;
CREATE POLICY "Instructors and Admins can view all meetings"
ON public.meetings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'instructor', 'staff', 'client_management')
  )
);

DROP POLICY IF EXISTS "Instructors and Admins can manage meetings" ON public.meetings;
CREATE POLICY "Instructors and Admins can manage meetings"
ON public.meetings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'instructor', 'staff', 'client_management')
  )
);

-- 7. CREATE INDEX for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_assigned_instructor
  ON public.subscriptions(assigned_instructor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_trial
  ON public.subscriptions(is_trial);
CREATE INDEX IF NOT EXISTS idx_subscriptions_student_plan
  ON public.subscriptions(student_id, plan_type, status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_master
  ON public.profiles(is_master_instructor) WHERE is_master_instructor = true;

-- 8. SET MASTER INSTRUCTOR FLAG
-- Run this after creating the Harsimrat account in Supabase Auth
-- UPDATE public.profiles SET is_master_instructor = true WHERE email = 'harsimrat@gmail.com';

-- ============================================================
-- VERIFY: After running this migration, verify with:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subscriptions';
-- ============================================================
