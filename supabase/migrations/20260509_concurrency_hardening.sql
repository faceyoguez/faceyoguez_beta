-- Migration: Concurrency Hardening & Atomic Operations
-- Description: Adds unique constraints to prevent race conditions and provides RPC functions for atomic increments.

-- 1. Prevent duplicate active trials for the same student and plan type
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_trial 
ON public.subscriptions (student_id, plan_type) 
WHERE (is_trial = true AND status = 'active');

-- 2. Prevent duplicate waiting queue entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_waiting_queue 
ON public.waiting_queue (student_id) 
WHERE (status = 'waiting');

-- 3. Atomic function to increment batch student count
CREATE OR REPLACE FUNCTION public.increment_batch_count(batch_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.batches
  SET current_students = COALESCE(current_students, 0) + 1,
      updated_at = NOW()
  WHERE id = batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Atomic function to decrement batch student count (for cancellations)
CREATE OR REPLACE FUNCTION public.decrement_batch_count(batch_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.batches
  SET current_students = GREATEST(COALESCE(current_students, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
