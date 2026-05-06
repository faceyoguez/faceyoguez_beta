-- Add multi-angle photo columns to journey_logs
-- Students can now upload: front, left profile, right profile per day

ALTER TABLE journey_logs
  ADD COLUMN IF NOT EXISTS photo_url_left  TEXT,
  ADD COLUMN IF NOT EXISTS photo_url_right TEXT;

-- Rename existing photo_url to photo_url_front for clarity (optional alias view)
-- We keep photo_url as-is for backward compatibility, it is the "front" view.

COMMENT ON COLUMN journey_logs.photo_url        IS 'Front-facing progress photo';
COMMENT ON COLUMN journey_logs.photo_url_left   IS 'Left side profile progress photo';
COMMENT ON COLUMN journey_logs.photo_url_right  IS 'Right side profile progress photo';
