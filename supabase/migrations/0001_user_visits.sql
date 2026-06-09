-- user_visits — fires on every dashboard mount so we can count
-- humans who reached the app, not just humans who successfully
-- generated a digest.
--
-- Why this table exists:
--   We don't use Supabase Auth (NextAuth is JWT-only), and no
--   existing table is written on plain sign-in. Before this table,
--   a user who signed in and bounced was invisible to the admin
--   dashboard. This row gets upserted on every dashboard mount, so
--   even browse-only sessions show up as a "Signed-in user".
--
-- How to run:
--   1. Open Supabase project
--   2. SQL editor → New query
--   3. Paste this whole file
--   4. Run
--
-- Idempotent: safe to run multiple times. The `IF NOT EXISTS`
-- guards mean re-running won't error or wipe existing data.

CREATE TABLE IF NOT EXISTS user_visits (
  user_id TEXT PRIMARY KEY,
  first_visit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_visit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visit_count INTEGER NOT NULL DEFAULT 1
);

-- Index supports the admin dashboard's "new users this week" query
-- which filters on first_visit_at.
CREATE INDEX IF NOT EXISTS user_visits_first_visit_at_idx
  ON user_visits (first_visit_at);

-- Index supports any future "active in last N days" queries.
CREATE INDEX IF NOT EXISTS user_visits_last_visit_at_idx
  ON user_visits (last_visit_at);
