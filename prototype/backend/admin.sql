-- RecallBond administrator controls. Additive migration, does not grant anyone admin.
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS suspension_reason text;
CREATE TABLE IF NOT EXISTS rb_admin_memberships (
  user_id uuid PRIMARY KEY REFERENCES rb_users(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES rb_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rb_admin_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id uuid NOT NULL REFERENCES rb_users(id),
  action text NOT NULL CHECK (action IN ('suspend_user','reinstate_user','verify_company','suspend_company','review_issue')),
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rb_admin_audit_newest ON rb_admin_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS rb_users_suspended_idx ON rb_users(suspended_at) WHERE suspended_at IS NOT NULL;
