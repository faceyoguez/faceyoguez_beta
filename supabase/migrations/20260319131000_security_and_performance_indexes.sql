--
-- SECURITY FIXES (Phase 6)
--

-- 1. Tighten notifications INSERT policy
DROP POLICY IF EXISTS "System/Instructors can insert notifications" ON public.notifications;
CREATE POLICY "System/Instructors can insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'instructor', 'admin')
  );

-- 2. Tighten profiles INSERT policy (trigger handles creation but in case it's manual)
DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.profiles;
CREATE POLICY "Allow profile creation on signup" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Fix SECURITY DEFINER views to SECURITY INVOKER
ALTER VIEW public.v_student_resources SET (security_invoker = true);
ALTER VIEW public.v_student_dashboard SET (security_invoker = true);
ALTER VIEW public.v_admin_overview SET (security_invoker = true);
ALTER VIEW public.v_chat_history SET (security_invoker = true);

-- 4. Fix Mutable Search Paths
ALTER FUNCTION public.set_updated_by() SET search_path = '';
ALTER FUNCTION public.set_current_timestamp_updated_at() SET search_path = '';
ALTER FUNCTION public.get_user_role() SET search_path = '';
ALTER FUNCTION public.is_conversation_participant(uuid) SET search_path = '';
ALTER FUNCTION public.is_chat_enabled(uuid) SET search_path = '';
ALTER FUNCTION public.update_updated_at() SET search_path = '';
ALTER FUNCTION public.update_conversation_on_message() SET search_path = '';
ALTER FUNCTION public.handle_batch_extension() SET search_path = '';
ALTER FUNCTION public.notify_chat_on_new_resource() SET search_path = '';

--
-- PERFORMANCE FIXES (Phase 7)
--

-- 1. Create missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_updated_by ON public.batch_enrollments(updated_by);
CREATE INDEX IF NOT EXISTS idx_batch_messages_batch_id ON public.batch_messages(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_messages_sender_id ON public.batch_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_batch_resources_updated_by ON public.batch_resources(updated_by);
CREATE INDEX IF NOT EXISTS idx_batches_conversation_id ON public.batches(conversation_id);
CREATE INDEX IF NOT EXISTS idx_batches_updated_by ON public.batches(updated_by);
CREATE INDEX IF NOT EXISTS idx_broadcasts_sender_id ON public.broadcasts(sender_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_target_batch_id ON public.broadcasts(target_batch_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_created_by ON public.conversation_participants(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_by ON public.conversations(updated_by);
CREATE INDEX IF NOT EXISTS idx_conversations_batch_id ON public.conversations(batch_id);
CREATE INDEX IF NOT EXISTS idx_meetings_batch_id ON public.meetings(batch_id);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON public.meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_meetings_host_id ON public.meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_meetings_student_id ON public.meetings(student_id);
CREATE INDEX IF NOT EXISTS idx_meetings_updated_by ON public.meetings(updated_by);
CREATE INDEX IF NOT EXISTS idx_notifications_broadcast_id ON public.notifications(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_student_resources_instructor_id ON public.student_resources(instructor_id);
CREATE INDEX IF NOT EXISTS idx_student_resources_student_id ON public.student_resources(student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_updated_by ON public.subscriptions(updated_by);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_created_by ON public.waiting_queue(created_by);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_subscription_id ON public.waiting_queue(subscription_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_updated_by ON public.waiting_queue(updated_by);

-- 2. Remove unused indexes
DROP INDEX IF EXISTS public.idx_subscriptions_assigned_instructor;
DROP INDEX IF EXISTS public.idx_subscriptions_is_trial;
DROP INDEX IF EXISTS public.idx_profiles_is_master;
DROP INDEX IF EXISTS public.idx_profiles_role;
DROP INDEX IF EXISTS public.idx_subscriptions_status;
DROP INDEX IF EXISTS public.idx_waiting_queue_status;
DROP INDEX IF EXISTS public.idx_subscriptions_created_by;
