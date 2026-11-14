# RecallBond operator console

The administrator interface is at `/admin/`. It is **not** available to all registered manufacturers or consumers. A sign-in session must be linked to an explicit `rb_admin_memberships` record and not be suspended; demo signup does not verify email ownership.

## First administrator

1. Sign up with your **personal operator email** at `/account/` (consumer role is acceptable). Never use a judge demonstration account or the example NovaTech issuer login for platform administration.
2. Independently confirm this is your personal operator account. Do not give admin membership to a judge account or another user's unverified contact identity.
3. With trusted database administration access, verify the exact user email and grant access:

```sql
SELECT id, email, suspended_at
FROM rb_users WHERE email = 'YOUR_OPERATOR_EMAIL@YOURDOMAIN';
-- Only after verifying this is the operator's own real address:
INSERT INTO rb_admin_memberships(user_id)
SELECT id FROM rb_users
WHERE email = 'YOUR_OPERATOR_EMAIL@YOURDOMAIN'
  AND suspended_at IS NULL
ON CONFLICT (user_id) DO NOTHING;
```

Do not run the template as-is. Substitute your actual personal operator email after confirming the account is yours. No public signup can choose an administrator role. Membership is a deliberate, auditable authorization action; **never** accept `role=admin` from public registration and do not create a hard-coded backdoor.

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

## Open-signup sponsor approval

Email ownership is **not verified** in this temporary hackathon flow. Any registered person may sign in immediately and gets a reserved wallet address. Automatic testnet funding requires an explicit administrator decision on the Users tab: **Approve testnet funding**. This inserts a one-time approval record (`rb_sponsor_approvals`) and shows in the combined audit trail. The request does not itself move test NEAR. Manufacturer companies additionally require separate company approval and NEAR contract issuer authorization. Limit sponsor deposits; inspect users before granting credit. Never use an unverified email address alone as evidence of identity.

Execute the additive `prototype/backend/open-signup.sql` migration before deploying the new code. Administrator membership itself is still bootstrapped only by trusted database access.
