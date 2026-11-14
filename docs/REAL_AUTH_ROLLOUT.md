# Real accounts and testnet wallets — deployment checklist

This is **real, database-backed code**, but not a live registration service until the external database, encryption secret and account-funding mechanism are configured and independently tested.

## Current scope

- Consumer and manufacturer signup with email/password, password hashing using Node scrypt, DB-backed sessions, HTTP-only cookies and logout.
- Manufacturer registration creates a **pending/unverified** business record, not a verified issuer.
- Each registration creates a unique Ed25519 keypair and associates a 64-character NEAR implicit ID to the user. The signing key is AES-256-GCM encrypted server-side. The key is never sent to the frontend.
- **A derived implicit account ID is not yet an active account on NEAR.** It must receive an authorized testnet funding transaction before it can make onchain actions. `reserved` wallet status is explicit.
- Defect issue reports use durable SQL. A submitted report does not create a warranty or guarantee compensation.
- Existing browser-local sample records remain clearly marked as examples.

## Required environment variables

- `DATABASE_URL`: URL for a dedicated Neon Postgres project; only backend/serverless API can access.
- `RB_WALLET_MASTER_KEY`: random 32-byte key encoded as 64 hex characters, stored only as a Vercel **encrypted/sensitive** environment variable. If lost, stored wallet keys cannot be decrypted. Rotate using a planned re-encryption procedure before changing it.
- `NODE_ENV=production` handled by Vercel. Cookies always use Secure + HttpOnly + SameSite Lax.

**Never** commit either secret, print them in logs, or put them in browser `.env` files.

## Setup

1. Install/authorize a Neon Postgres account and provision a dedicated database for RecallBond testnet.
2. Execute [the schema migration](../prototype/backend/schema.sql) on that database with an authorized DB administrator.
3. Configure `DATABASE_URL` and `RB_WALLET_MASTER_KEY` on the existing Vercel project for preview/production as appropriate.
4. Deploy; confirm `/api/auth?action=health` reports ready, not a database configuration error.
5. Register a consumer, check persistent account survives browser logout/login and fresh device; register a manufacturer and confirm its status is **unverified**.
6. Verify two registrations get different reserved testnet wallet IDs and never disclose the private key.
7. Configure a separately approved/safe **sponsor account funding** service with spending limits and abuse protection. Until then show wallet as **Reserved — awaiting onchain activation**; do not claim it is funded/onchain-active.
8. Add email verification and secure password reset/recovery before public production use. No mainnet/real funds until independent security review.

## Safety limitations

This is an experimental testnet-only custodial wallet design; platform-controlled encryption key permits decryption, so it is **not self-custody**. Private-key export, staff role management, verified manufacturer issuance, password reset, email delivery and transaction sponsorship are not yet provided by this phase. The production-grade approach should use a hardened embedded wallet/MPC service for scalable user-controlled signing.

The NovaTech issuer account already registered on contract `rb-vk97-261112.testnet` is not assigned to every newly created manufacturer. Approve organizations, authorize issuer identities and ensure separate company signing keys.

## Operating cost

Vercel can serve the UI and serverless API. Neon (or an equivalent Postgres provider) is a separate service; free tiers may suffice during testing, subject to quotas. Railway setup was attempted but the connected workspace's trial is expired; no Railway resources were created.

## Email-verification rollout (14 November 2026)

The SQL migration `prototype/backend/verification.sql` creates short-lived hashed verification codes; applied to the dedicated Neon testnet auth database. The authenticated `/api/email?action=request` and `/api/email?action=confirm` serverless routes are implemented. Consumer issue submission is withheld from unverified users until code confirmation. Codes expire after 10 minutes, use random six-digit values, HMAC-SHA256 hashes, 90-second resend cooldown, five resend/hour quota, six unsuccessful guesses, and session/same-origin checks.

The **sending provider is not configured yet**, so these endpoints return a clear unavailable response and do not falsely mark an email as verified. To activate on Vercel, set encrypted environment variables:

- `RB_ZEPTO_SEND_API_KEY`: your verified ZeptoMail Agent Send API key (never paste the key into GitHub, chat, or logs).
- `RB_MAIL_FROM`: verified sender address authorized by that ZeptoMail Agent.

Then redeploy; request a code, receive it in a real inbox, confirm, and verify `rb_users.email_verified_at` updates before exercising persistent support reports. Prefer a dedicated RecallBond sending domain/Agent; do not reuse an unrelated product's sender without authorization. Provider API docs: https://www.zoho.com/cpaas/help/api/email-sending.html.

**Still not implemented**: password reset and account recovery, sponsor-funded testnet wallet activation, issuer-role verification and transaction signing from account sessions. Current wallet identities remain in **reserved** state, not live NEAR accounts.
