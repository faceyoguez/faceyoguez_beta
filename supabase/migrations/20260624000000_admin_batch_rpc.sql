-- Migration: Add admin RPC to update batch end date (bypasses RLS policies that
-- reference batch_enrollments during a batches UPDATE, which caused a 42P01 error
-- when the batch_enrollments table was not yet in the search_path).

CREATE OR REPLACE FUNCTION public.admin_update_batch_end_date(
  p_batch_id UUID,
  p_end_date DATE
)
RETURNS void AS $$
BEGIN
  UPDATE public.batches
  SET end_date = p_end_date
  WHERE id = p_batch_id;

  -- Also extend all enrollments in this batch
  UPDATE public.batch_enrollments
  SET effective_end_date = p_end_date::text
  WHERE batch_id = p_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
