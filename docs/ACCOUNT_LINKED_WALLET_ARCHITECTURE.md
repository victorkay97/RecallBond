# RecallBond — Seamless authentication and NEAR wallet architecture
Status: implementation proposal only; **not deployed**. Last updated 14 November 2026.
Target: Replace manual wallet connection with email/password onboarding plus a secure, account-linked NEAR wallet. The existing NEAR testnet contract `rb-vk97-261112.testnet` remains the authoritative NFT/recall ledger.

## Product behavior (desired)

1. A consumer registers with email, password and verified email ownership. No blockchain jargon or external wallet signup.
2. The application provisions a unique NEAR account in the background and stores its *public account ID* against the authenticated user.
3. The consumer's product NFTs, eligibility and compensation are read from the chain and connected to their account.
4. A user can inspect account ID, balances, transaction history and a secure recovery/export route in Settings → Wallet.
5. Issuing, transferring or withdrawing always requires the user's actual authorization; a server session is not a blanket authorization to move assets.
6. A manufacturer registers a company and is approved/verified, then an owner manages team members/permissions. Real issuance and recall transactions must be authorized by the registered onchain issuer account.

## Authentication, database and wallet must remain distinct

- **App identity**: auth provider / application sessions. Email verification, password hashing and reset tokens handled by a hardened authentication service, never client-side mock storage.
- **Wallet identity**: unique NEAR public account per user or company, linked via a database mapping. That link is editable only by authorized backend workflows and must never be accepted from an arbitrary browser claim.
- **Private key custody / signing**: a separately audited wallet architecture. User should not be forced to enter a wallet address at registration. The application must never send raw private keys, recovery phrases or passwords to logs, analytics, frontend bundles or public API responses.
- **Transaction sponsorship**: provision accounts with a sponsor-controlled testnet funding mechanism; use quotas and abuse limits. Do not run unbounded testnet faucet calls per signup.

## Embedded wallet design decision (choose before coding)

**Preferred user experience:** account-linked embedded wallet with user-controlled signing/recovery, using a proven service that explicitly supports *NEAR testnet*, proper owner authorization, account export where needed, and session/relayer permissions.

**Potential strategies:**

- **Provider-assisted MPC/passkey wallet:** Reduces wallet setup friction; email/password authentication plus secure account derivation and signing. *Important*: if no single private key ever exists or export is not supported, do **not** promise a downloadable private key. Offer the actual recovery/portability controls the provider supports. Testnet compatibility must be verified. NEAR Auth documentation currently describes a mainnet-specific service, so it cannot be assumed to cover our testnet demo.
- **Self-custodial encrypted key vault:** A keypair can be generated locally and an encrypted backup stored server-side, with encryption keys controlled by user credentials and a proper recovery strategy. This is much more engineering/security work than generating a key on the server and returning it to the browser. A password reset must not silently change account control or leave a wallet unrecoverable. Do not use password-only encryption with no hardened key derivation/recovery policy.
- **Custodial signing service:** Technically easier but creates significant platform custody and compromise risk. It requires encrypted key management in a KMS/HSM, step-up checks, strict authorization, auditing, withdrawal limits and well-defined export and disaster recovery. Do not build improvised custodial storage for a hackathon.

**No-go patterns:** plaintext key in the users table, reusable issuer key in frontend environment variables, localStorage for full-access secrets, username/password hashing in frontend JS, email-based password reset implicitly replacing an existing onchain owner, client-controlled `issuer` field authorizing writes, or silently signing high-risk transfers.

## Recommended backend modules

- `auth`: user registration, email verification, login, logout, password reset, session/token rotation, rate limiting.
- `accounts`: user profile, organisation, company membership, role verification, state of onboarding.
- `wallets`: secure provision request, public chain account mapping, signing authorization, recovery/export capability, disabled/suspended flags, account reconciliation.
- `products`: offchain product model, public NFT token ID, manufacturer and onchain issuer, batch, non-sensitive metadata and evidence links.
- `issues`: defect reports, images, reviewer assignments, status transitions, immutable activity log.
- `recalls`: campaigns indexed by immutable onchain IDs; command requests tied to signed chain transactions; onchain status always authoritative.
- `notifications`: claim status and recall updates.

Suggested normalized database tables: `users`, `sessions`, `wallet_accounts` (UNIQUE `user_id`, UNIQUE `near_account_id` for personal wallets), `organizations`, `organization_memberships`, `products`, `issue_reports`, `issue_events`, `transactions` (idempotency key + receipt hash), `notifications`.

## Signed action journey

- **Manufacturer issues passport:** authenticated role → product data validated → authorizer approves registered issuer signing → signed NEAR transaction → poll finalized receipt → index minted token. Never mark minted before confirmed receipt.
- **Manufacturer activates recall:** issuer authorization → require batch and exact max-liability calculation → funding transaction finalized → only then activation transaction → index status.
- **Consumer transfers passport:** authenticate, verify live ownership, obtain explicit transaction authorization with exact recipient and token ID → sign → wait finality → update UI. Do not change offchain owner in advance.
- **Consumer claims:** check current token owner onchain, use one-claim-per-token guard → signed action → verify recorded claimant and contract credit.
- **Consumer withdraws:** signed withdrawal action → confirm callback success and final credit reduction → show paid, not merely submitted.
- **Defect issue:** authenticated HTTP POST to backend and durable DB; only claim onchain when the contractual eligibility path requires it. Not every reported defect implies compensation.

## End-user onboarding: five screens

1. Welcome: **Create your RecallBond account** — email and password, terms/privacy.
2. Verify email — clear re-send and expiry behavior.
3. Wallet setup behind the scenes — progress, safe retry, no blockchain setup requested.
4. Account ready — show `NEAR testnet account linked` and shortened address with copy affordance.
5. First product — receive/scan a product passport or explore the clearly labeled NovaTech testnet demo.

For companies: company basics → email verification → organization validation → authorized issuer role → team onboarding → first passport. The NovaTech demo may use a preconfigured approved organization, but must never be presented as a genuinely verified commercial manufacturer.

## Required acceptance tests before claiming this is live

- Sign up with two different emails; two different wallets provisioned and linked; concurrent registration is idempotent.
- Sign out / log in on another device; the same wallet and holdings return.
- Password reset and account recovery work without stolen funds or loss of account control.
- Unauthenticated person cannot view private records or initiate any action.
- Member without issuer rights cannot mint or fund a campaign; company member roles cannot be escalated by client input.
- Incorrect account cannot transfer/claim; rightful current owner can; duplicate claim fails.
- Claim/withdraw receipt observed in finalized RPC before success message.
- Private-key export, if offered, is securely authorized and accessible only through intended mechanisms.
- No plaintext keys, passwords, emails or raw serials are exposed to chain, logs or public JavaScript.

## Implementation sequence

**Milestone A:** User auth / organization model, verified email login, backend sessions and real persistent issue reports.

**Milestone B:** Wallet solution selected and validated on NEAR testnet; account creation and safe key custody/recovery, public account linking and sponsorship.

**Milestone C:** Signed onchain manufacturer and consumer transactions through the new auth flow; transaction finality status, retries/idempotency and audit logs.

**Milestone D:** Remove technical wallet-selection controls from normal UI, keep advanced wallet management under Profile → Security, add tooltips and five-step onboarding.

## Present hackathon state

Completed: real deployed contract; NEP-171 mint, transfer, funded/active recall, correct-owner claim, rejected former-owner/duplicate attempts, settled testnet payout; public RPC lookup.

Not yet completed: registered user accounts, verified company signup, backend issue-report persistence, automatically created wallets tied to email/password and seamless in-app account recovery/export. These must be labeled roadmap features until independently tested.

Reference: https://github.com/victorkay97/RecallBond/blob/main/docs/TESTNET_EVIDENCE_2026-11-12.md
