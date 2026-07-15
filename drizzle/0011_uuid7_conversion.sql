-- Convert serial (integer) primary keys to uuid across the events and elections
-- modules, backfilling every existing row's id (and every FK that points at it)
-- with a deterministic zero-padded uuid derived from the old integer, so existing
-- relationships and any hardcoded/bookmarked integer references keep resolving.
-- New rows going forward get a real UUIDv7 value generated in the app layer.
--
-- event_transactions.id/contestant_id go through the identical STEP 1-4 dance.
-- On production this is a no-op (an earlier partial push already force-cast
-- them to uuid while the table was empty, so no data was lost there) but its
-- FK constraint and two indexes were dropped by that push and never restored -
-- STEP 5/6 re-add those. On a fresh database this is what performs the actual
-- conversion.
--
-- Composite unique constraints are declared with columns in ascending physical
-- column order (matching schema.ts) because drizzle-kit's introspection reports
-- multi-column unique constraints in attnum order rather than creation order -
-- declaring them any other way produces a spurious diff on every future push.

BEGIN;

-- ==========================================
-- STEP 1: add new uuid columns and backfill
-- ==========================================

ALTER TABLE events ADD COLUMN id_new uuid;
UPDATE events SET id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(id), 12, '0'))::uuid;
ALTER TABLE events ALTER COLUMN id_new SET NOT NULL;

ALTER TABLE categories ADD COLUMN id_new uuid;
UPDATE categories SET id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(id), 12, '0'))::uuid;
ALTER TABLE categories ALTER COLUMN id_new SET NOT NULL;
ALTER TABLE categories ADD COLUMN event_id_new uuid;
UPDATE categories SET event_id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(event_id), 12, '0'))::uuid;
ALTER TABLE categories ALTER COLUMN event_id_new SET NOT NULL;

ALTER TABLE contestants ADD COLUMN id_new uuid;
UPDATE contestants SET id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(id), 12, '0'))::uuid;
ALTER TABLE contestants ALTER COLUMN id_new SET NOT NULL;
ALTER TABLE contestants ADD COLUMN category_id_new uuid;
UPDATE contestants SET category_id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(category_id), 12, '0'))::uuid;
ALTER TABLE contestants ALTER COLUMN category_id_new SET NOT NULL;

ALTER TABLE elections ADD COLUMN id_new uuid;
UPDATE elections SET id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(id), 12, '0'))::uuid;
ALTER TABLE elections ALTER COLUMN id_new SET NOT NULL;

ALTER TABLE positions ADD COLUMN id_new uuid;
UPDATE positions SET id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(id), 12, '0'))::uuid;
ALTER TABLE positions ALTER COLUMN id_new SET NOT NULL;
ALTER TABLE positions ADD COLUMN election_id_new uuid;
UPDATE positions SET election_id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(election_id), 12, '0'))::uuid;
ALTER TABLE positions ALTER COLUMN election_id_new SET NOT NULL;

ALTER TABLE candidates ADD COLUMN id_new uuid;
UPDATE candidates SET id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(id), 12, '0'))::uuid;
ALTER TABLE candidates ALTER COLUMN id_new SET NOT NULL;
ALTER TABLE candidates ADD COLUMN position_id_new uuid;
UPDATE candidates SET position_id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(position_id), 12, '0'))::uuid;
ALTER TABLE candidates ALTER COLUMN position_id_new SET NOT NULL;

ALTER TABLE voters ADD COLUMN id_new uuid;
UPDATE voters SET id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(id), 12, '0'))::uuid;
ALTER TABLE voters ALTER COLUMN id_new SET NOT NULL;
ALTER TABLE voters ADD COLUMN election_id_new uuid;
UPDATE voters SET election_id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(election_id), 12, '0'))::uuid;
ALTER TABLE voters ALTER COLUMN election_id_new SET NOT NULL;

ALTER TABLE election_votes ADD COLUMN id_new uuid;
UPDATE election_votes SET id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(id), 12, '0'))::uuid;
ALTER TABLE election_votes ALTER COLUMN id_new SET NOT NULL;
ALTER TABLE election_votes ADD COLUMN election_id_new uuid;
UPDATE election_votes SET election_id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(election_id), 12, '0'))::uuid;
ALTER TABLE election_votes ALTER COLUMN election_id_new SET NOT NULL;
ALTER TABLE election_votes ADD COLUMN position_id_new uuid;
UPDATE election_votes SET position_id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(position_id), 12, '0'))::uuid;
ALTER TABLE election_votes ALTER COLUMN position_id_new SET NOT NULL;
ALTER TABLE election_votes ADD COLUMN candidate_id_new uuid;
UPDATE election_votes SET candidate_id_new =
  CASE WHEN candidate_id IS NULL THEN NULL
       ELSE ('00000000-0000-0000-0000-' || lpad(to_hex(candidate_id), 12, '0'))::uuid END;

ALTER TABLE event_transactions ADD COLUMN id_new uuid;
UPDATE event_transactions SET id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(id), 12, '0'))::uuid;
ALTER TABLE event_transactions ALTER COLUMN id_new SET NOT NULL;
ALTER TABLE event_transactions ADD COLUMN contestant_id_new uuid;
UPDATE event_transactions SET contestant_id_new = ('00000000-0000-0000-0000-' || lpad(to_hex(contestant_id), 12, '0'))::uuid;
ALTER TABLE event_transactions ALTER COLUMN contestant_id_new SET NOT NULL;

-- ==========================================
-- STEP 2: drop old constraints/indexes that reference the integer columns
-- ==========================================

ALTER TABLE categories DROP CONSTRAINT categories_event_id_events_id_fk;
ALTER TABLE contestants DROP CONSTRAINT contestants_category_id_categories_id_fk;
-- event_transactions' FK must go before contestants' old integer pkey is dropped below
ALTER TABLE event_transactions DROP CONSTRAINT event_transactions_contestant_id_contestants_id_fk;
DROP INDEX event_contestant_idx;
ALTER TABLE positions DROP CONSTRAINT positions_election_id_elections_id_fk;
ALTER TABLE candidates DROP CONSTRAINT candidates_position_id_positions_id_fk;
ALTER TABLE voters DROP CONSTRAINT voters_election_id_elections_id_fk;
ALTER TABLE election_votes DROP CONSTRAINT election_votes_election_id_elections_id_fk;
ALTER TABLE election_votes DROP CONSTRAINT election_votes_position_id_positions_id_fk;
ALTER TABLE election_votes DROP CONSTRAINT election_votes_candidate_id_candidates_id_fk;

ALTER TABLE categories DROP CONSTRAINT categories_event_id_code_unique;
ALTER TABLE voters DROP CONSTRAINT voters_election_id_email_unique;
ALTER TABLE voters DROP CONSTRAINT voters_election_id_username_unique;
DROP INDEX election_votes_lookup_idx;

ALTER TABLE events DROP CONSTRAINT events_pkey;
ALTER TABLE categories DROP CONSTRAINT categories_pkey;
ALTER TABLE contestants DROP CONSTRAINT contestants_pkey;
ALTER TABLE elections DROP CONSTRAINT elections_pkey;
ALTER TABLE positions DROP CONSTRAINT positions_pkey;
ALTER TABLE candidates DROP CONSTRAINT candidates_pkey;
ALTER TABLE voters DROP CONSTRAINT voters_pkey;
ALTER TABLE election_votes DROP CONSTRAINT election_votes_pkey;

-- ==========================================
-- STEP 3: drop old integer columns, rename new uuid columns into place
-- ==========================================

ALTER TABLE events DROP COLUMN id;
ALTER TABLE events RENAME COLUMN id_new TO id;

ALTER TABLE categories DROP COLUMN id;
ALTER TABLE categories RENAME COLUMN id_new TO id;
ALTER TABLE categories DROP COLUMN event_id;
ALTER TABLE categories RENAME COLUMN event_id_new TO event_id;

ALTER TABLE contestants DROP COLUMN id;
ALTER TABLE contestants RENAME COLUMN id_new TO id;
ALTER TABLE contestants DROP COLUMN category_id;
ALTER TABLE contestants RENAME COLUMN category_id_new TO category_id;

ALTER TABLE elections DROP COLUMN id;
ALTER TABLE elections RENAME COLUMN id_new TO id;

ALTER TABLE positions DROP COLUMN id;
ALTER TABLE positions RENAME COLUMN id_new TO id;
ALTER TABLE positions DROP COLUMN election_id;
ALTER TABLE positions RENAME COLUMN election_id_new TO election_id;

ALTER TABLE candidates DROP COLUMN id;
ALTER TABLE candidates RENAME COLUMN id_new TO id;
ALTER TABLE candidates DROP COLUMN position_id;
ALTER TABLE candidates RENAME COLUMN position_id_new TO position_id;

ALTER TABLE voters DROP COLUMN id;
ALTER TABLE voters RENAME COLUMN id_new TO id;
ALTER TABLE voters DROP COLUMN election_id;
ALTER TABLE voters RENAME COLUMN election_id_new TO election_id;

ALTER TABLE election_votes DROP COLUMN id;
ALTER TABLE election_votes RENAME COLUMN id_new TO id;
ALTER TABLE election_votes DROP COLUMN election_id;
ALTER TABLE election_votes RENAME COLUMN election_id_new TO election_id;
ALTER TABLE election_votes DROP COLUMN position_id;
ALTER TABLE election_votes RENAME COLUMN position_id_new TO position_id;
ALTER TABLE election_votes DROP COLUMN candidate_id;
ALTER TABLE election_votes RENAME COLUMN candidate_id_new TO candidate_id;

ALTER TABLE event_transactions DROP COLUMN id;
ALTER TABLE event_transactions RENAME COLUMN id_new TO id;
ALTER TABLE event_transactions DROP COLUMN contestant_id;
ALTER TABLE event_transactions RENAME COLUMN contestant_id_new TO contestant_id;

-- ==========================================
-- STEP 4: re-add primary keys
-- ==========================================

ALTER TABLE events ADD PRIMARY KEY (id);
ALTER TABLE categories ADD PRIMARY KEY (id);
ALTER TABLE contestants ADD PRIMARY KEY (id);
ALTER TABLE elections ADD PRIMARY KEY (id);
ALTER TABLE positions ADD PRIMARY KEY (id);
ALTER TABLE candidates ADD PRIMARY KEY (id);
ALTER TABLE voters ADD PRIMARY KEY (id);
ALTER TABLE election_votes ADD PRIMARY KEY (id);
ALTER TABLE event_transactions ADD PRIMARY KEY (id);

-- ==========================================
-- STEP 5: re-add foreign keys (including event_transactions', which the
-- earlier partial push dropped and never restored)
-- ==========================================

ALTER TABLE categories ADD CONSTRAINT categories_event_id_events_id_fk
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE contestants ADD CONSTRAINT contestants_category_id_categories_id_fk
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE event_transactions ADD CONSTRAINT event_transactions_contestant_id_contestants_id_fk
  FOREIGN KEY (contestant_id) REFERENCES contestants(id) ON DELETE CASCADE;
ALTER TABLE positions ADD CONSTRAINT positions_election_id_elections_id_fk
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;
ALTER TABLE candidates ADD CONSTRAINT candidates_position_id_positions_id_fk
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE;
ALTER TABLE voters ADD CONSTRAINT voters_election_id_elections_id_fk
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;
ALTER TABLE election_votes ADD CONSTRAINT election_votes_election_id_elections_id_fk
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;
ALTER TABLE election_votes ADD CONSTRAINT election_votes_position_id_positions_id_fk
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE;
ALTER TABLE election_votes ADD CONSTRAINT election_votes_candidate_id_candidates_id_fk
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;

-- ==========================================
-- STEP 6: re-add unique constraints / indexes
-- (including event_transactions' two btree indexes dropped by the earlier
-- partial push)
-- ==========================================

ALTER TABLE categories ADD CONSTRAINT categories_event_id_code_unique UNIQUE (code, event_id);
ALTER TABLE contestants ADD CONSTRAINT contestants_code_unique UNIQUE (code);
CREATE INDEX trans_voter_phone_idx ON event_transactions USING btree (pay_phone);
CREATE INDEX event_contestant_idx ON event_transactions USING btree (contestant_id);
ALTER TABLE voters ADD CONSTRAINT voters_election_id_email_unique UNIQUE (email, election_id);
ALTER TABLE voters ADD CONSTRAINT voters_election_id_username_unique UNIQUE (username, election_id);
CREATE INDEX election_votes_lookup_idx ON election_votes USING btree (election_id, position_id);

-- ==========================================
-- STEP 7: events.start_at / events.end_at / events.image_url
-- ==========================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS start_at timestamp;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_at timestamp;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url text;

COMMIT;
