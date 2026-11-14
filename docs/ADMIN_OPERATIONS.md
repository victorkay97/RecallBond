# RecallBond operator console

The administrator interface is at `/admin/`. It is **not** available to all registered manufacturers or consumers. A sign-in session must be linked to an explicit `rb_admin_memberships` record and have a verified email address; accounts under suspension cannot use it.

## First administrator

1. Sign up with your **personal operator email** at `/account/` (consumer role is acceptable). Never use a judge demonstration account or the example NovaTech issuer login for platform administration.
2. Complete email verification using a configured transactional sender.
3. With trusted database administration access, verify the exact user email and grant access:

```sql
SELECT id, email, email_verified_at, suspended_at
FROM rb_users WHERE email = 'YOUR_VERIFIED_EMAIL@YOURDOMAIN';
-- Only after verifying this is the operator's own real address:
INSERT INTO rb_admin_memberships(user_id)
SELECT id FROM rb_users
WHERE email = 'YOUR_VERIFIED_EMAIL@YOURDOMAIN'
  AND email_verified_at IS NOT NULL
  AND suspended_at IS NULL
ON CONFLICT (user_id) DO NOTHING;
```

Do not run the template as-is. Substitute the confirmed personal admin email. Membership is a deliberate, auditable authorization action; **never** accept `role=admin` from public registration and do not create a hard-coded backdoor.

## Dashboard

- Aggregates **real** user, manufacturer, reserved wallet, active wallet, issue and verified company counts from Postgres; no fabricated totals.
- Lists recent users, companies, issues and operator actions (currently up to 40 rows each).
- Suspends users and revokes every active session; restoration does not restore previous sessions.
- Reviews companies as `verified` or `suspended` **inside the platform only**. NEAR issuer authorization requires a separate contract transaction initiated by its admin.
- Triage of support requests: `under_review`, `more_info`, `approved_repair`, `approved_replacement` or `declined`. These are **support workflow status**, not funded NEAR compensation.
- Records all changes in `rb_admin_audit`. Protect the database and keep backups.

## Safety boundaries

Admin dashboard cannot send NEAR, sign user transactions, mint passports, access wallet private keys, override contract ownership or grant onchain issuer status. The source code is public but the console API always requires a verified admin session. All writes require same-origin requests, validate target IDs, and block suspending admins or oneself.

## Current database

- Neon project: `recallbond-testnet-auth` (dedicated testnet-only)
- Schema migration: `prototype/backend/admin.sql` (additive migration applied)
- Do not put admin credentials, database connection strings or wallet keys in the GitHub repository or a judge handoff.
