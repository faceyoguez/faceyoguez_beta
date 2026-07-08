-- Fix relation "batches" does not exist error on resource upload
-- Setting search_path to 'public' allows the trigger function to find the batches table
ALTER FUNCTION public.notify_chat_on_new_resource() SET search_path = 'public';
