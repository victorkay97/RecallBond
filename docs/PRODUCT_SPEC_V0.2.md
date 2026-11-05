# RecallBond product specification — v0.2 (5 November 2026)

**Status: approved product direction; NOT all features implemented.** The current browser demo is a simulation; NEAR Sandbox has validated the original direct-transfer, claim-on-demand contract. This spec describes intended customer flows and must not be confused with working code.

## Product promise

**Financial protection that follows the product.** Manufacturers issue a verified digital passport (NEP-171 NFT) for a registered physical device. Consumers receive the passport in an app-linked NEAR account. Unclaimed transferable compensation rights follow the current passport holder. Claims follow explicit campaign conditions.

## Three product surfaces

| Surface | URL proposal | Identity requirement | Audience |
| --- | --- | --- | --- |
| Business | `/business` | Verified organization and role | Manufacturers, later authorized retailers |
| Consumer | `/app` | Authenticated consumer and linked NEAR account | Current product owners |
| Verify | `/verify` and `/verify/:passportId` | **None** for public verification | Anyone checking a product passport |

A shared landing page explains what RecallBond does. Business and Consumer are distinct role-aware experiences, not three separate blockchains. Verify is public and privacy-minimized.

## Consumer account and wallet

**Ideal onboarding:** User enters name, email and chooses a secure sign-in method, verifies their identity, and gets an app-linked NEAR account without needing to manually handle keys.

**Implementation constraint:** Do NOT generate an unencrypted private key on the application server or store private keys beside password hashes. Select a reputable NEAR-compatible passkey, embedded-wallet, or delegated-signing provider. Evaluate providers for testnet support, licensing, custody, recovery, cost and integration maturity. Support existing wallet connections where possible.

Signup requirements:
1. Verify email and create offchain consumer profile.
2. Establish wallet association (embedded/provisioned account OR an existing NEAR wallet).
3. Persist stable NEAR account ID and provider reference. Keep personally identifying information offchain.
4. Show wallet provisioning errors distinctly; retry safely without generating duplicate accounts or losing access.
5. Offer recovery, additional authentication and re-authentication for transfers or withdrawal.
6. Use session management, throttling, email verification and appropriate abuse prevention.

**Wallet panel:** NEAR testnet balance (clearly labeled), pending claim credits **within RecallBond contract**, already withdrawn transfers and transaction history. A contract claim credit is **not** the same as liquid NEAR in the user's wallet.

### Consumer navigation

- **Overview:** registered products count, active protections, recall alerts, claim credit and notifications.
- **My Products:** product cards, add/activate, product details, transfer, archive, report issue.
- **Claims & Compensation:** eligibility, required steps, claims, payout state.
- **Wallet:** onchain NEAR balance vs claimable contract credit, withdrawal, explorer links.
- **Profile & Security:** contact methods, recovery, linked wallet, login history, privacy controls.

## Product registration / activation

**Manufacturer side**
1. Manufacturer passes business verification and is allowlisted to issue product passports.
2. Uploads product identifiers securely (model, batch, private serial/IMEI reference).
3. RecallBond issues one passport per authorized product with an opaque ID and cryptographic commitment. Do not store raw IMEI, phone number, retail receipt or owner name onchain.
4. A QR code refers to the passport's public record. **The QR alone must never prove the right to claim a product.**
5. Manufacturer/authorized retailer issues an activation credential or a signed sale confirmation for first assignment.

**Consumer side**
1. Consumer selects **Add a product**, scans a QR or enters a passport ID.
2. App shows *public* manufacturer verification and product summary.
3. Consumer proves entitlement via one-time activation credential, retailer signature or device-backed manufacturer verification.
4. Only after verification is the passport assigned/transferred to the linked NEAR account.
5. A QR copied from packaging is insufficient for claiming the product.

### Physical identifiers

Treat IMEI and serial number as *manufacturer-controlled references*, not proof of current possession. Dual-SIM phones can carry multiple IMEIs. Hashing predictable raw IMEI without an issuer-controlled secret can permit brute-force lookup: use an issuer-side random salt/HMAC or opaque product ID, document key management, and avoid publishing secret material in NFT metadata.

## Consumer ownership transfer

**Commercial desired flow**
1. Owner opens **My Products → Product → Transfer ownership**.
2. Identifies recipient by RecallBond account ID or verified directory alias; never assume a display name is trustworthy.
3. Server resolves the alias to a NEAR account and prompts owner to confirm the full destination.
4. Recipient gets a transfer request and must accept it; sender may cancel while pending.
5. Sender authorizes the actual NEP-171 transfer. The system waits for definitive chain confirmation and shows failed/pending/completed states separately.
6. On completion, dashboard updates; future **unclaimed** transferable rights follow the new passport owner.
7. Previously approved financial credit remains with the claimant, even if the passport later moves.

**Important:** Current hackathon smart contract implements direct `nft_transfer`; it does **not** yet implement a full two-party escrow/acceptance handoff. The latter is a phase-two feature and must not be claimed as complete.

## Manufacturer recall workflow

Business can manage:
- product issuance and batches;
- protection/coverage terms and evidence requirements;
- recall campaigns with affected batches, budget, expiry and verification conditions;
- funded reserve and accounting;
- aggregate claim, payout and status reporting.

### Two compensation policy types

**A. Unconditional automatic benefit (future):**
- Requires a campaign that expressly permits unconditional payouts.
- Contract must establish an eligibility snapshot, a funded maximum exposure and one-time entitlement per passport.
- Prefer **automatic assignment of a claimable credit** or permissionless user/relayer-triggered withdrawal over naive fanout transfers to thousands of accounts.
- Do not confuse 'eligible', 'allocated credit' and 'settled in wallet'.
- Operational funding/gas/storage costs and campaign refunds must be addressed.

**B. Conditional compensation (initial MVP):**
- User receives an alert when registered product is in a qualifying batch.
- Campaign may require verified inspection, repair/replacement or product return.
- Authorized evidence must be checked **before** the smart contract pays. An offchain check alone must not be misrepresented as independently verified onchain.
- For the current hackathon contract, the demo policy is **simple unconditional eligibility, but explicitly user-initiated claim**; no actual inspection or issuer attestation is performed.
- If adding conditional evidence after the hackathon, it requires new contract states/methods and verification authorization, not merely frontend gating.

### Financial UX terminology

1. **Eligible** — product may qualify under campaign criteria; no funds in wallet yet.
2. **Claim available** — user can invoke a funded onchain claim.
3. **Claim approved** — contract recorded an irrevocable claimant credit; funds remain in contract.
4. **Withdrawal pending** — transfer promise submitted, not yet final.
5. **Paid** — final NEAR settlement confirmed and wallet balance can be queried.
6. **Rejected / expired** — reason presented without revealing private data.

The user suggestion of automatic money receipt is the **future UX goal**; current contract does not push token transfers to every eligible owner.

## Public Verify: deliberately anonymous

URL: `/verify` (QR scan or passport ID), public `/verify/:passportId` detail.

Show:
- manufacturer verification status / verified issuer profile;
- product brand/model and public batch information if safe;
- passport status: issued / active / reported disputed / revoked if supported;
- transferability of coverage and coverage expiration;
- relevant published recall programs, entitlement already used flag where appropriate;
- **ownership registered (yes/no)** and a challenge-based proof of control for prospective purchasers;
- public NEAR token ID/contract address when useful, and a clear limitation statement.

**Do not show:** public owner name, email, phone, shipping address, raw serial/IMEI, full sale receipt or other sensitive identifiers.

**Owner proof option (later):** Seller voluntarily signs a short-lived challenge using the account that holds the NFT. Verify signature/NEAR ownership at the time of proof. Buyer learns that the seller controls the passport, not their personal identity or guaranteed physical possession. Bind proof to a nonce, specific passport ID, intended recipient, and expiry.

**QR security:** A QR is a locator, not an ownership credential. Public status must not be used as proof that a physical phone is genuine, legally owned, not stolen or in working condition.

## Archive ≠ transfer ≠ deletion

- **Archive** hides a passport from the owner's *interface*; preserves onchain ownership and history.
- **Transfer** changes onchain registered ownership via signed transaction.
- **Report lost/stolen** can flag an item for review; must not arbitrarily reassign rights.
- **Privacy deletion request** removes eligible offchain personal information subject to retention requirements; cannot promise to erase public historical chain data.
- **Burn** is not equivalent to deleting the physical product or its documented rights and should not be the consumer's default Delete action.

## Commercial constraints and trust boundaries

- An NFT passport does **not** itself prove legal title to, or physical possession of, the phone.
- Manufacturer-backed financial obligations require issuer authorization and clear terms.
- Recall safety requirements cannot be bypassed merely because a user owns an NFT.
- Actual naira credits require compliant payout/payment infrastructure. Demo native NEAR testnet amounts are not naira.
- Contracts manage rights/escrow; backend handles encrypted offchain records, alerts and issuer identity.
- Multi-wallet or lost-account recovery and account-abstraction provider failure must be covered before a commercial launch.

## Build phases

| Feature | Hackathon target | After hackathon |
| --- | --- | --- |
| Manufacturer allowlist, mint, campaigns and reserve | **Contract working in Sandbox** | Real manufacturer verification, import API, administrator roles |
| Direct NFT transfer and current-owner claim | **Contract working in Sandbox** | Recipient request/acceptance and fraud alerts |
| Consumer wallet signup with email | Architecture/spec only; optional if low-risk | Embedded wallet with recovery and gas abstraction |
| Consumer My Products, claim and wallet balance | Wire to testnet contract | Rich dashboard, notifications |
| Public `/verify` passport lookup | Minimal public read-only lookup | Optional proof of control, QR scanning and manufacturer authenticity integrations |
| Auto-credit unconditional recall | Not implemented | Implement permissionless allocation / claim settlement and test costs |
| Conditional claim proof | Not implemented | Inspection attestations and claims review |
| Archive/report lost and privacy handling | Interface only, labeled | Offchain workflows with policy and moderation |

## Immediate acceptance criteria for the website

1. Verify page is publicly accessible with no login.
2. Private owner information is never exposed by public APIs or metadata.
3. Consumer page clearly distinguishes **Claimable in contract** from **Available in wallet**.
4. A pending claim is never called paid before chain finality.
5. Direct NFT transfer requires explicit destination and wallet signature.
6. SIM/IMEI and QR alone do not suffice to claim initial ownership.
7. Archive has no effect on the onchain passport owner.
8. UI marks every simulated screen as simulated until testnet integration is done.
