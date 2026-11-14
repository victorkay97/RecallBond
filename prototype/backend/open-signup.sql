-- Additive migration for low-friction signup and operator-approved testnet sponsorship.
-- Phone is an unverified contact field, not proof of phone ownership.
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS phone_number text;
CREATE UNIQUE INDEX IF NOT EXISTS rb_users_phone_number_unique
 ON rb_users(phone_number) WHERE phone_number IS NOT NULL;
-- A verified admin, after independent review, grants the one-time sponsor eligibility.
-- Public account registration NEVER creates an approval record.
CREATE TABLE IF NOT EXISTS rb_sponsor_approvals (
 user_id uuid PRIMARY KEY REFERENCES rb_users(id) ON DELETE CASCADE,
 granted_by uuid NOT NULL REFERENCES rb_users(id),
 granted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rb_sponsor_approvals_newest ON rb_sponsor_approvals(granted_at DESC);

-- Existing environments need the additional audited sponsor action.
ALTER TABLE rb_admin_audit DROP CONSTRAINT IF EXISTS rb_admin_audit_action_check;
ALTER TABLE rb_admin_audit ADD CONSTRAINT rb_admin_audit_action_check
  CHECK (action IN ('suspend_user','reinstate_user','verify_company',
                   'suspend_company','review_issue','approve_sponsor'));
