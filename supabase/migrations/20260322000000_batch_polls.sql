-- Batch Poll Feature
-- Allows staff/instructors to create polls in group batch chat

-- Poll container
CREATE TABLE IF NOT EXISTS batch_polls (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id    uuid        NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  created_by  uuid        NOT NULL REFERENCES profiles(id),
  question    text        NOT NULL,
  is_closed   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Poll answer options
CREATE TABLE IF NOT EXISTS batch_poll_options (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     uuid  NOT NULL REFERENCES batch_polls(id) ON DELETE CASCADE,
  option_text text  NOT NULL,
  position    int   NOT NULL DEFAULT 0
);

-- Student votes — one vote per student per poll (upsert to change vote)
CREATE TABLE IF NOT EXISTS batch_poll_votes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    uuid        NOT NULL REFERENCES batch_polls(id) ON DELETE CASCADE,
  option_id  uuid        NOT NULL REFERENCES batch_poll_options(id) ON DELETE CASCADE,
  voter_id   uuid        NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, voter_id)
);

-- Add poll-type support to batch_messages
ALTER TABLE batch_messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS poll_id uuid REFERENCES batch_polls(id) ON DELETE SET NULL;

-- Enable realtime so clients receive live vote updates
ALTER PUBLICATION supabase_realtime ADD TABLE batch_poll_votes;

-- RLS
ALTER TABLE batch_polls        ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_poll_votes   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batch_polls_select"        ON batch_polls        FOR SELECT USING (true);
CREATE POLICY "batch_polls_insert"        ON batch_polls        FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "batch_polls_update"        ON batch_polls        FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "batch_poll_options_select" ON batch_poll_options FOR SELECT USING (true);
CREATE POLICY "batch_poll_options_insert" ON batch_poll_options FOR INSERT WITH CHECK (true);

CREATE POLICY "batch_poll_votes_select"   ON batch_poll_votes   FOR SELECT USING (true);
CREATE POLICY "batch_poll_votes_insert"   ON batch_poll_votes   FOR INSERT WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "batch_poll_votes_update"   ON batch_poll_votes   FOR UPDATE USING (auth.uid() = voter_id);
