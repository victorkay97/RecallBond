-- Additive migration: one-time account-email confirmation codes.
CREATE TABLE IF NOT EXISTS rb_email_verifications (
  user_id uuid PRIMARY KEY REFERENCES rb_users(id) ON DELETE CASCADE,
  code_hash text NOT NULL CHECK(length(code_hash)=64),
  expires_at timestamptz NOT NULL,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  sent_count integer NOT NULL DEFAULT 1,
  attempts integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS rb_email_verifications_expiry_idx ON rb_email_verifications(expires_at);
