-- Fix: handle_batch_extension trigger function had search_path = '' set by a
-- previous security migration, which caused it to fail with 
-- "relation batch_enrollments does not exist" when updating the batches table,
-- because table references inside the function were unqualified.
-- We replace the function body with fully qualified table names and restore
-- search_path = public so it works correctly.

CREATE OR REPLACE FUNCTION public.handle_batch_extension()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a batch end_date is extended, also extend all active enrollments
  -- whose effective_end_date matches the OLD end_date (i.e. they were capped to the batch end).
  IF NEW.end_date IS DISTINCT FROM OLD.end_date AND NEW.end_date > OLD.end_date THEN
    UPDATE public.batch_enrollments
    SET effective_end_date = NEW.end_date
    WHERE batch_id = NEW.id
      AND (
        effective_end_date = OLD.end_date
        OR effective_end_date < NEW.end_date::text
      );
  END IF;
  RETURN NEW;
END;
$$;
