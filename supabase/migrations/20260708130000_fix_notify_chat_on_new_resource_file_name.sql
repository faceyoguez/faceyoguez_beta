-- Fix "column file_name of relation chat_messages does not exist" error on group resource upload.
-- notify_chat_on_new_resource() was inserting a file_name value into chat_messages, which only
-- ever had file_url. This aborted every batch_resources insert triggered by it, breaking the
-- shared-resources upload flow for group sessions (used identically by both staff and instructor UIs).
CREATE OR REPLACE FUNCTION public.notify_chat_on_new_resource()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  SELECT conversation_id INTO v_conversation_id
  FROM public.batches
  WHERE id = NEW.batch_id;

  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO public.chat_messages (conversation_id, sender_id, content, content_type, file_url)
    VALUES (
      v_conversation_id,
      NEW.uploader_id,
      COALESCE(NEW.title, 'New resource shared'),
      'system_alert',
      NEW.file_url
    );
  END IF;

  RETURN NEW;
END;
$$;
