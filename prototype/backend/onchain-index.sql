-- Minimal index for real NEAR passport/campaign operations. NEAR remains source of truth.
CREATE TABLE IF NOT EXISTS rb_onchain_products (
 token_id text PRIMARY KEY,
 issuer_user_id uuid NOT NULL REFERENCES rb_users(id),
 organization_id uuid NOT NULL REFERENCES rb_organizations(id),
 batch_id text NOT NULL,
 serial_commitment text NOT NULL,
 title text NOT NULL,
 original_owner_account_id text NOT NULL,
 tx_hash text,
 status text NOT NULL DEFAULT 'sending' CHECK (status IN ('sending','confirmed','manual_review')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rb_onchain_products_org_idx ON rb_onchain_products(organization_id,created_at DESC);
CREATE INDEX IF NOT EXISTS rb_onchain_products_owner_idx ON rb_onchain_products(original_owner_account_id);
CREATE TABLE IF NOT EXISTS rb_onchain_campaigns (
 campaign_id bigint PRIMARY KEY,
 organization_id uuid NOT NULL REFERENCES rb_organizations(id),
 batch_id text NOT NULL,
 create_tx_hash text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rb_chain_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES rb_users(id),
 action text NOT NULL,
 token_id text,
 campaign_id bigint,
 tx_hash text,
 status text NOT NULL CHECK (status IN ('submitted','confirmed','failed','manual_review')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rb_chain_audit_by_user ON rb_chain_audit(user_id,created_at DESC);
