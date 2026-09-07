-- Guest / anonymous accounts (used so potential students can browse the
-- locked dashboard before registering) have NO email and NO metadata yet.
-- The existing handle_new_user() trigger builds full_name from
-- split_part(NEW.email, '@', 1) — for an anonymous user NEW.email is NULL,
-- so that comes back NULL too, and the insert below would fail. This adds
-- a dedicated, early-exit path for anonymous sign-ins with safe,
-- guaranteed-unique placeholder values, and leaves the real-signup path
-- (below it) completely untouched.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_phone TEXT;
BEGIN
  -- ── Guest / anonymous account — separate, safe path ──────────────
  IF NEW.is_anonymous THEN
    INSERT INTO public.profiles (id, email, full_name, phone, role)
    VALUES (
      NEW.id,
      NEW.id::text || '@guest.faceyoguez.internal', -- unique placeholder, never a real inbox
      'Guest',
      NULL,
      'student'::public.user_role
    );
    RETURN NEW;
  END IF;

  -- ── Real sign-up — unchanged from before ──────────────────────────
  -- Extract values using the exact keys sent from NextJS SignUpForm
  v_role := NEW.raw_user_meta_data->>'role';
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_phone := NEW.raw_user_meta_data->>'phone';

  -- Default fallback for full_name
  IF v_full_name IS NULL OR v_full_name = '' THEN
    v_full_name := split_part(NEW.email, '@', 1);
  END IF;

  -- Default fallback for role logic
  IF v_role IS NULL OR v_role = '' THEN
    v_role := 'student';
  END IF;

  -- Ensure we don't accidentally insert an invalid enum by forcing 'student'
  -- if the incoming string isn't recognized.
  IF v_role NOT IN ('admin', 'instructor', 'staff', 'student') THEN
    v_role := 'student';
  END IF;

  -- Finally, insert into Profiles table using the validated data
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_phone,
    v_role::public.user_role
  );

  RETURN NEW;
END;
$$;
