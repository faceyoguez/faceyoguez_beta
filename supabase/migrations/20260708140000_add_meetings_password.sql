-- Store the Zoom meeting password on the meetings table (group/one-on-one sessions).
-- Zoom already returns a password when creating a meeting, but it was being discarded —
-- consultation_zoom_calls already stores it; this mirrors that pattern so the embedded
-- Meeting SDK join flow has what it needs for both meeting types.
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS password text;
