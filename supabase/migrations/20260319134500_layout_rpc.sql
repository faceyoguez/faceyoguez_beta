--
-- PERFORMANCE RPC: CONSOLIDATED LAYOUT DATA
-- This reduces RTT from 3+ to 1 for the dashboard layout.
--

CREATE OR REPLACE FUNCTION public.get_dashboard_layout_data(p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_role public.user_role;
  v_unread_count bigint := 0;
  v_active_plans text[] := ARRAY[]::text[];
  v_profile public.profiles;
BEGIN
  -- 1. Get entire profile row
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  -- 2. If no profile, we can't do much
  IF v_profile.id IS NULL THEN
    RETURN NULL;
  END IF;

  v_role := v_profile.role;

  -- 3. If student, get notifications and subscriptions
  IF v_role = 'student' THEN
    -- Unread count (using a fast count)
    SELECT count(*) INTO v_unread_count 
    FROM public.notifications 
    WHERE user_id = p_user_id AND is_read = false;

    -- Active plans
    SELECT array_agg(plan_type::text) INTO v_active_plans 
    FROM public.subscriptions
    WHERE student_id = p_user_id AND status IN ('active', 'pending');
  END IF;

  RETURN json_build_object(
    'profile', row_to_json(v_profile),
    'unreadNotificationsCount', COALESCE(v_unread_count, 0),
    'activePlans', COALESCE(v_active_plans, ARRAY[]::text[])
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
