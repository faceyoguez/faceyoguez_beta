-- ================================================================
-- PERF FIX: Missing FK Indexes + RLS InitPlan Optimization
-- Fixes disk I/O pressure and per-row auth evaluation overhead
-- ================================================================

-- ──────────────────────────────────────────────────────────────
-- PART 1: Missing FK Indexes
-- batch_polls tables were created AFTER the main index migration
-- so their FK columns never got indexed.
-- ──────────────────────────────────────────────────────────────

-- batch_polls foreign keys
CREATE INDEX IF NOT EXISTS idx_batch_polls_batch_id
  ON public.batch_polls(batch_id);

CREATE INDEX IF NOT EXISTS idx_batch_polls_created_by
  ON public.batch_polls(created_by);

-- batch_poll_options foreign keys
CREATE INDEX IF NOT EXISTS idx_batch_poll_options_poll_id
  ON public.batch_poll_options(poll_id);

-- batch_poll_votes foreign keys
-- NOTE: UNIQUE(poll_id, voter_id) already covers poll_id lookups;
--       option_id and voter_id still need dedicated indexes.
CREATE INDEX IF NOT EXISTS idx_batch_poll_votes_option_id
  ON public.batch_poll_votes(option_id);

CREATE INDEX IF NOT EXISTS idx_batch_poll_votes_voter_id
  ON public.batch_poll_votes(voter_id);

-- batch_messages.poll_id (added via ALTER TABLE in batch_polls migration)
CREATE INDEX IF NOT EXISTS idx_batch_messages_poll_id
  ON public.batch_messages(poll_id);

-- consultation tables — missing FK indexes
CREATE INDEX IF NOT EXISTS idx_consultation_messages_sender_id
  ON public.consultation_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_consultation_zoom_calls_created_by
  ON public.consultation_zoom_calls(created_by);

CREATE INDEX IF NOT EXISTS idx_consultations_credit_subscription_id
  ON public.consultations(credit_subscription_id);

-- ──────────────────────────────────────────────────────────────
-- PART 2: RLS InitPlan Fix
-- Replace bare auth.uid() calls with (select auth.uid()) so
-- PostgreSQL treats them as a one-time InitPlan per statement
-- rather than re-evaluating the function for every row.
-- ──────────────────────────────────────────────────────────────

-- ── batch_polls ───────────────────────────────────────────────
DROP POLICY IF EXISTS "batch_polls_insert" ON public.batch_polls;
CREATE POLICY "batch_polls_insert" ON public.batch_polls
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "batch_polls_update" ON public.batch_polls;
CREATE POLICY "batch_polls_update" ON public.batch_polls
  FOR UPDATE USING ((select auth.uid()) = created_by);

-- ── batch_poll_votes ──────────────────────────────────────────
DROP POLICY IF EXISTS "batch_poll_votes_insert" ON public.batch_poll_votes;
CREATE POLICY "batch_poll_votes_insert" ON public.batch_poll_votes
  FOR INSERT WITH CHECK ((select auth.uid()) = voter_id);

DROP POLICY IF EXISTS "batch_poll_votes_update" ON public.batch_poll_votes;
CREATE POLICY "batch_poll_votes_update" ON public.batch_poll_votes
  FOR UPDATE USING ((select auth.uid()) = voter_id);

-- ── consultations ─────────────────────────────────────────────
DROP POLICY IF EXISTS "consultations_select" ON public.consultations;
CREATE POLICY "consultations_select" ON public.consultations
  FOR SELECT USING (
    (select auth.uid()) = student_id OR
    (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
      IN ('staff', 'admin', 'instructor', 'client_management')
  );

DROP POLICY IF EXISTS "consultations_insert" ON public.consultations;
CREATE POLICY "consultations_insert" ON public.consultations
  FOR INSERT WITH CHECK ((select auth.uid()) = student_id);

DROP POLICY IF EXISTS "consultations_update" ON public.consultations;
CREATE POLICY "consultations_update" ON public.consultations
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
      IN ('staff', 'admin', 'instructor', 'client_management')
    OR (select auth.uid()) = student_id
  );

-- ── consultation_messages ─────────────────────────────────────
DROP POLICY IF EXISTS "consultation_messages_select" ON public.consultation_messages;
CREATE POLICY "consultation_messages_select" ON public.consultation_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
        AND (
          c.student_id = (select auth.uid())
          OR c.staff_id = (select auth.uid())
          OR (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
               IN ('staff', 'admin', 'instructor', 'client_management')
        )
    )
  );

DROP POLICY IF EXISTS "consultation_messages_insert" ON public.consultation_messages;
CREATE POLICY "consultation_messages_insert" ON public.consultation_messages
  FOR INSERT WITH CHECK (
    (select auth.uid()) = sender_id AND
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
        AND (
          c.student_id = (select auth.uid())
          OR c.staff_id = (select auth.uid())
          OR (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
               IN ('staff', 'admin', 'instructor', 'client_management')
        )
    )
  );

DROP POLICY IF EXISTS "consultation_messages_update" ON public.consultation_messages;
CREATE POLICY "consultation_messages_update" ON public.consultation_messages
  FOR UPDATE USING ((select auth.uid()) = sender_id);

-- ── consultation_zoom_calls ───────────────────────────────────
DROP POLICY IF EXISTS "consultation_zoom_select" ON public.consultation_zoom_calls;
CREATE POLICY "consultation_zoom_select" ON public.consultation_zoom_calls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
        AND (
          c.student_id = (select auth.uid())
          OR c.staff_id = (select auth.uid())
          OR (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
               IN ('staff', 'admin', 'instructor', 'client_management')
        )
    )
  );

DROP POLICY IF EXISTS "consultation_zoom_insert" ON public.consultation_zoom_calls;
CREATE POLICY "consultation_zoom_insert" ON public.consultation_zoom_calls
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
      IN ('staff', 'admin', 'instructor', 'client_management')
  );
