-- Additive migration for low-friction signup and operator-approved testnet sponsorship.
-- A verified admin, after independent review, grants the one-time sponsor eligibility.
-- Public account registration NEVER creates an approval record.
CREATE TABLE IF NOT EXISTS rb_sponsor_approvals (
 user_id uuid PRIMARY KEY REFERENCES rb_users(id) ON DELETE CASCADE,
 granted_by uuid NOT NULL REFERENCES rb_users(id),
 granted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rb_sponsor_approvals_newest ON rb_sponsor_approvals(granted_at DESC);

