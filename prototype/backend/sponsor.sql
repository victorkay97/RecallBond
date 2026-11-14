-- One-time, limited NEAR testnet sponsor credits for verified app users.
-- No automatic retry after sending begins: operator must reconcile uncertain receipts.
CREATE TABLE IF NOT EXISTS rb_wallet_activations (
 user_id uuid PRIMARY KEY REFERENCES rb_users(id) ON DELETE CASCADE,
 account_id text UNIQUE NOT NULL CHECK (length(account_id)=64),
 funding_day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
 funding_slot integer NOT NULL CHECK (funding_slot BETWEEN 1 AND 10),
 amount_yocto numeric(39,0) NOT NULL CHECK (amount_yocto > 0),
 status text NOT NULL DEFAULT 'sending' CHECK (status IN ('sending','submitted','active','manual_review')),
 tx_hash text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (funding_day,funding_slot)
);
CREATE INDEX IF NOT EXISTS rb_wallet_activations_status_idx ON rb_wallet_activations(status,created_at DESC);
