-- PropChamps Rewards — D1 schema (idempotent). Run once against the D1 database.
-- Balances are denormalized on `users` but every change is also written to
-- points_ledger (append-only) so the truth is auditable and reversible.

CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY,
  discord_id       TEXT UNIQUE NOT NULL,
  username         TEXT NOT NULL,
  avatar           TEXT,
  email            TEXT,                          -- from Discord (email scope); used for approval/rejection emails
  lifetime_points  INTEGER NOT NULL DEFAULT 0,   -- drives TIER (loyalty); never decreases
  season_points    INTEGER NOT NULL DEFAULT 0,   -- drives the LEADERBOARD; reset each quarter (top 10 carry 1,000)
  spendable_points INTEGER NOT NULL DEFAULT 0,   -- what redemptions draw from; never reset by seasons
  banned           INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_pts    ON users(lifetime_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_season ON users(season_points DESC);
-- If users already exists from an earlier migration, add the columns:
--   ALTER TABLE users ADD COLUMN email TEXT;
--   ALTER TABLE users ADD COLUMN season_points INTEGER NOT NULL DEFAULT 0;
--   UPDATE users SET season_points = lifetime_points;   -- seed the current (first) season
-- The current season key lives in app_state under 'season_key' (e.g. 202609 = Fall 2026).

CREATE TABLE IF NOT EXISTS submissions (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  firm_slug      TEXT NOT NULL,
  claimed_amount TEXT,
  kind           TEXT NOT NULL DEFAULT 'purchase', -- purchase (CHAMP buy, +250) | payout (1 pt per $1, admin-entered)
  image_key      TEXT NOT NULL,     -- R2 object key
  image_hash     TEXT,              -- SHA-256 of the bytes, for dedup
  status         TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  ai_score       REAL,              -- Phase 2: AI triage confidence
  ai_notes       TEXT,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  reviewed_by    TEXT,
  reviewed_at    TEXT,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sub_user   ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_sub_hash   ON submissions(image_hash);
-- If submissions already exists from an earlier migration, add the column:
--   ALTER TABLE submissions ADD COLUMN kind TEXT NOT NULL DEFAULT 'purchase';

CREATE TABLE IF NOT EXISTS points_ledger (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  delta         INTEGER NOT NULL,
  reason        TEXT NOT NULL,
  submission_id TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON points_ledger(user_id);

CREATE TABLE IF NOT EXISTS redemptions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  reward_name  TEXT NOT NULL,
  cost_points  INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'requested',  -- requested | fulfilled | denied
  created_at   TEXT NOT NULL,
  fulfilled_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_redeem_user ON redemptions(user_id);

CREATE TABLE IF NOT EXISTS admin_actions (
  id         TEXT PRIMARY KEY,
  admin      TEXT NOT NULL,
  action     TEXT NOT NULL,
  target     TEXT,
  note       TEXT,
  created_at TEXT NOT NULL
);

-- Generic key/value app state (strongly consistent, unlike KV). Used for the
-- live giveaway open/closed flag so it flips instantly on stream.
CREATE TABLE IF NOT EXISTS app_state (
  k TEXT PRIMARY KEY,
  v TEXT
);

-- The current live-giveaway entry pool. Wiped on reset; emails are preserved
-- separately in email_list so a reset never loses the collected list.
-- Login-gated: one entry per Discord user. Wiped on giveaway reset; emails
-- are preserved separately in email_list so a reset never loses the list.
CREATE TABLE IF NOT EXISTS giveaway_entries (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL UNIQUE,   -- one entry per Discord user
  username   TEXT,
  email      TEXT,                   -- from Discord (email scope); may be null
  created_at TEXT NOT NULL
);

-- Permanent email list — every email ever entered, forever. The owned asset.
CREATE TABLE IF NOT EXISTS email_list (
  email        TEXT PRIMARY KEY,
  name         TEXT,
  source       TEXT,
  first_seen   TEXT NOT NULL,
  unsubscribed INTEGER NOT NULL DEFAULT 0
);
-- If email_list already exists from an earlier migration, add the column:
--   ALTER TABLE email_list ADD COLUMN unsubscribed INTEGER NOT NULL DEFAULT 0;

-- Monthly raffle (wired next). One active cycle at a time.
CREATE TABLE IF NOT EXISTS raffle_cycles (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  draw_date      TEXT,
  status         TEXT NOT NULL DEFAULT 'active',
  winner_user_id TEXT,
  created_at     TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS raffle_entries (
  id         TEXT PRIMARY KEY,
  cycle_id   TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  username   TEXT NOT NULL,
  entries    INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(cycle_id, user_id)
);
