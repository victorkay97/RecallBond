-- RecallBond persistent account model for Neon PostgreSQL.
-- Execute once on a fresh dedicated NEAR testnet database. Never store plaintext credentials.
BEGIN;
CREATE TABLE IF NOT EXISTS rb_users (
  id uuid PRIMARY KEY, email text NOT NULL, password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('consumer','manufacturer')),
  email_verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);
CREATE TABLE IF NOT EXISTS rb_wallets (
  id uuid PRIMARY KEY, user_id uuid UNIQUE NOT NULL REFERENCES rb_users(id) ON DELETE CASCADE,
  near_account_id text UNIQUE NOT NULL CHECK (length(near_account_id) = 64),
  public_key text NOT NULL, encrypted_secret text NOT NULL,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','active','disabled')),
  network text NOT NULL DEFAULT 'testnet' CHECK (network = 'testnet'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rb_organizations (
  id uuid PRIMARY KEY, owner_user_id uuid UNIQUE NOT NULL REFERENCES rb_users(id) ON DELETE CASCADE,
  name text NOT NULL, status text NOT NULL DEFAULT 'unverified'
    CHECK (status IN ('unverified','pending_review','verified','suspended')),
  issuer_near_id text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rb_sessions (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES rb_users(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL, revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS rb_sessions_user_idx ON rb_sessions(user_id,expires_at);
CREATE TABLE IF NOT EXISTS rb_login_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, identifier_hash text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(), successful boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS rb_login_attempts_idx ON rb_login_attempts(identifier_hash,attempted_at);
CREATE TABLE IF NOT EXISTS rb_issue_reports (
  id uuid PRIMARY KEY, consumer_user_id uuid NOT NULL REFERENCES rb_users(id),
  token_id text NOT NULL, category text NOT NULL,
  description text NOT NULL, status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','under_review','more_info','approved_repair','approved_replacement','declined')),
  organization_id uuid REFERENCES rb_organizations(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rb_issue_consumer_idx ON rb_issue_reports(consumer_user_id,created_at DESC);
COMMIT;
