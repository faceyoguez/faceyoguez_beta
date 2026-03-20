-- Add plan_variant column to subscriptions table to support sub-plan tiers
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS plan_variant TEXT;

-- Optional: add a comment describing the field
COMMENT ON COLUMN public.subscriptions.plan_variant IS 
  'Sub-variant of the plan type, e.g. monthly_limited, monthly_lifetime, quarterly, biannual, annual, level1, level1_2';
