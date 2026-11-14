# RecallBond

**Financial protection that follows the product.**

RecallBond is a **NEAR Hackathon 2026** entry for **NFTs That Do Something**. It gives physical goods transferable, publicly verifiable digital passports and connects them to manufacturer-funded recall compensation. The blockchain checks **who owns the NFT right now** before crediting a recall benefit; former owners cannot claim it, and the same passport cannot claim twice.

> **Status: working NEAR testnet contract + live auth/database + integrated application under test.** The onchain claim-and-payout lifecycle was independently demonstrated end-to-end. Browser account registration is live; sponsor activation, email delivery and newly integrated account-signed contract actions still require final configuration and browser testing. The example NovaTech UI is explicitly fictional.

**Web app:** https://recallbond.vercel.app/  
**Public verifier:** https://recallbond.vercel.app/verify/  
**Create account:** https://recallbond.vercel.app/account/  
**Authenticated workspace:** https://recallbond.vercel.app/studio/  
**Sample consumer demo:** https://recallbond.vercel.app/app/  
**Sample manufacturer demo:** https://recallbond.vercel.app/business/  
**Admin console:** https://recallbond.vercel.app/admin/ (verified operators only)  
**Documentation:** https://recallbond.vercel.app/docs/

## The problem

Manufacturers often lose an accurate ownership trail when products are resold, so recalls and warranty-related support are hard to target, verify and settle. Customers may have weak proof of eligibility; a past owner might try to redeem protection that should belong to the next owner. RecallBond uses a transferable **NEP-171 NFT passport** as a public ownership reference and an explicitly funded, auditable recall reserve.

- **Manufacturer:** registers a batch, issues an NFT passport to a product owner, starts a recall, funds the full potential liability, and activates compensation.
- **Consumer:** finds owned products in a mobile-friendly account, transfers a passport, sees relevant recalls, claims if eligible, withdraws approved NEAR, and reports device problems.
- **Verifier:** reads passport owner, batch and issuer from a real testnet contract. It does not reveal a plaintext serial, consumer name or password, and does not prove physical authenticity by itself.
- **Administrator:** moderates registered accounts and company eligibility, sees actual registration/issue/wallet metrics, suspends accounts, and reviews an audit trail. Platform approval does **not** silently grant blockchain issuer rights.

## Verified onchain story

All items below were confirmed by NEAR CLI transactions and independent reads of the **deployed contract** `rb-vk97-261112.testnet`.

| Step | What was proven | Transaction |
|---|---|---|
| 1 | Deploy + initialize the smart contract | [Deployment](https://explorer.testnet.near.org/transactions/8ueoDCeK9boo3UpzBhd9FUdPmsHtN6PnSgGPoKLLL4xf) |
| 2 | Register sample manufacturer NovaTech | [Issuer registration](https://explorer.testnet.near.org/transactions/AuvAYr3KEaP94z5umAiGwVxXARTmge78VCXU4CNkCfAV) |
| 3 | Mint passport `RB-NV-002891` for Ada | [NFT mint](https://explorer.testnet.near.org/transactions/AsGyzqgtgCs23EUBN4yCfdgRdSjoz4AA8p3VQnt5hucN) |
| 4 | Ada transfers NFT to Tomi | [NEP-171 transfer](https://explorer.testnet.near.org/transactions/49TB1NbHQLNjfhi1eALV7yCBahef3L9AXZ7XCpWUFcMo) |
| 5 | NovaTech creates recall for `BATTERY-X21` | [Campaign #0](https://explorer.testnet.near.org/transactions/naGYNEk65ZvUL4WJbo5Nagnq7aVKAtsYhsi66o4eXbu) |
| 6 | Manufacturer funds **0.1 test NEAR**, the full liability | [Funding](https://explorer.testnet.near.org/transactions/CpeFEKMSEjG5vvRu4moBDD3c43rY6dEWzakSJSuCTXHJ) |
| 7 | Campaign activates | [Activation](https://explorer.testnet.near.org/transactions/4iJ9cYgyT6ieSzndWRvFdtoBjqwXwtkCfVEaN7ibgXqb) |
| 8 | Former owner Ada is rejected | [Rejected claim](https://explorer.testnet.near.org/transactions/2TrjKqrjoLcjX2McdB1ntE2bJwZRJARUznxPQnSHuLNL) |
| 9 | Current owner Tomi successfully claims **0.1 test NEAR** | [Claim](https://explorer.testnet.near.org/transactions/HmYwR5dw1BMrsNpsHWjiXsTAv5AJQwJafMRhcKxku5vX) |
| 10 | Duplicate claim is rejected | [Rejected duplicate](https://explorer.testnet.near.org/transactions/Fhq97He6cNaXFDQL8v1jLMsTZqWRwz9PjcLv8EiQzGsB) |
| 11 | Tomi withdraws; final callback returns `true` and credit becomes zero | [Final payout](https://explorer.testnet.near.org/transactions/6zLUqcwAvcf1cEhNVPjkUZrhLH66a3xmjFxTGbP23eru) |

The payout was confirmed in the user's finalized account at a block height after the claim. These are **testnet** transactions with no real-money value. See [the reproducible evidence ledger](docs/TESTNET_EVIDENCE_2026-11-12.md).

## Architecture

```text
Browser / mobile responsive UI
  ├─ /                 Landing + FAQ
  ├─ /account          Real email/password signup, sessions, email code UI
  ├─ /studio           Authenticated consumer/manufacturer testnet actions
  ├─ /admin            Restricted administrative console
  ├─ /verify           Public read-only NEAR lookup
  └─ /app, /business   Clearly labeled sample/demo experiences
              │
          Vercel API
  ├─ /api/auth    Persistent account, company and issue records
  ├─ /api/email   One-time email verification (sender config needed)
  ├─ /api/wallet  One-time bounded testnet sponsor activation (sponsor config needed)
  ├─ /api/chain   Account-linked onchain mint/transfer/campaign/claim/payout
  └─ /api/admin   Verified operators, suspensions, approval and audits
       │                               │
   Neon PostgreSQL                 NEAR TESTNET
   (sessions, roles,              rb-vk97-261112.testnet
   encrypted keys,                 (NEP-171 + funded
   issue and tx index)             recall compensation)
```

A new user registers with **email and password**. Email verification is optional for the hackathon demo; the email is unverified contact information, not proof of identity. A unique Ed25519 keypair is generated server-side; only the **public** account address is returned. Signing keys are AES-256-GCM encrypted and associated with their account in PostgreSQL. No external wallet connection is required for the account-linked design, but the server is a **custodian** of encrypted keys in this experimental MVP. **It is not a self-custody mainnet wallet.**

A generated implicit NEAR address begins in **reserved** state. Only a separate, capped testnet sponsor transfer creates/funds the onchain account and allows it to become **active**. Funding requires an explicit administrator approval for each person; an unfunded user can sign in and view a reserved wallet without email delivery. A wallet funded externally can be reconciled without sponsor approval. Sponsor signing credentials are still required for automatic funding.

## Functionality status

| Feature | Status as of 14 Nov 2026 |
|---|---|
| Contract NFT mint, ownership transfer, recall funding, claim and payout | **Proven via real testnet transactions** |
| Live read-only passport verification | **Deployed and tested** |
| Email/password consumer + manufacturer signup, session, logout, persistent company records | **Live; signed-up consumer and manufacturer QA tested** |
| Distinct encrypted NEAR identity linked to each registered person | **Live (reserved until funding)** |
| PostgreSQL metrics, admin audit, suspension, company approval, issue triage | **Implemented; operator membership must be explicitly granted** |
| Email one-time verification codes | **Optional; ZeptoMail sender key not configured** |
| One-time, budget-capped wallet sponsor activation | **Operator-approved per wallet; sponsor account and signing credential not yet configured** |
| Account-signed mint, transfer, funded campaign, claim, withdraw | **Implemented API/workspace; needs real funded-account browser E2E** |
| Durable issue reporting routed to issuer after onchain ownership check | **Implemented; needs verified-account integration test** |
| Password reset, secure wallet export/recovery, independent security audit | **Not implemented** |
| Manufacturer-specific ad hoc payout for one issue | **Not yet in the deployed contract; support triage is separate from recalls** |

**Important:** approving a manufacturer in the platform does not register its account as a contract issuer. The NEAR contract administrator must explicitly authorize that address onchain. Similarly, opening a support ticket does not automatically grant compensation.

## Judge guide

**Fastest no-signup tour**

1. [Explore the consumer sample](https://recallbond.vercel.app/app/): two example passports with the same minimal NEAR/RecallBond cover, tap-to-flip QR and clearly labeled example actions.
2. [Explore the manufacturer sample](https://recallbond.vercel.app/business/): illustrative NovaTech business views and signed-action tooling.
3. [Verify the actual minted passport](https://recallbond.vercel.app/verify/?id=RB-NV-002891): public read-only `get_product` state and transaction receipts.
4. Open the evidence links above to review Ada → Tomi ownership changes, rejection of unauthorized/duplicate claims and finalized payout.

**Real-account tour**

1. [Register](https://recallbond.vercel.app/account/) as a consumer or manufacturer. Accounts and wallet identities persist in Neon.
2. No email code is needed to sign in. Ask the operator to approve your one-time testnet wallet funding, then activate when the sponsor is configured. Manufacturer company approval remains mandatory.
3. Visit [/studio](https://recallbond.vercel.app/studio/) to view real ownership and call the contract. A manufacturer must also pass platform verification **and** be registered onchain.
4. To test the complete lifecycle, create a **new batch and campaign**. Campaign #0 is already fully claimed and paid: do not fund or claim it again.

**Demo credentials:** We intentionally do **not** publish a private key, funded testnet-account password or admin login in a public repository. The sample workspaces are available without login. Disposable judge accounts, when provisioned and funded, should be shared only through a private judge-facing submission channel, not committed to GitHub.

## Running the project

```bash
git clone https://github.com/victorkay97/RecallBond.git
cd RecallBond/prototype
npm install
npm test
npm run test:ui
```

To view the static frontend locally:

```bash
python3 -m http.server 4173
# http://localhost:4173
```

The static preview does **not** provide the authenticated Vercel APIs unless those routes are separately served by Vercel's local development environment.

## Deployment checklist

1. Vercel serves `prototype/` and its Node serverless functions. Restrict privileged environment values to the server.
2. Neon SQL migrations in `prototype/backend/` must be applied to a **dedicated testnet project**.
3. Set `DATABASE_URL` and a random 32-byte hex `RB_WALLET_MASTER_KEY` as **encrypted** Vercel environment variables. Never publish them or rotate the master key without re-encrypting stored wallet records.
4. Optional — to enable real email confirmation, configure **`RB_ZEPTO_SEND_API_KEY`** and **`RB_MAIL_FROM`** for a verified ZeptoMail domain.
5. Apply `prototype/backend/open-signup.sql` to the testnet-only database for operator-approved testnet sponsorship, then create a separate sponsor on testnet, and set **`RB_SPONSOR_ACCOUNT_ID`**, **`RB_SPONSOR_PRIVATE_KEY`** and optional **`RB_SPONSOR_DAILY_MAX`**. Keep only a small testnet budget on that account.
6. Register your personal admin account, independently verify you own it, then grant a membership manually as specified in [admin operations](docs/ADMIN_OPERATIONS.md). No public signup can elect itself administrator.
7. Verify real mint/claim browser transactions and security checks before advertising it as a completely autonomous end-to-end product.

**Release readiness and actual E2E gate:** [operator go-live checklist](docs/RELEASE_OPERATIONS_2026-11-14.md). The optional `npm run test:live` command checks a deployed environment; it never makes a NEAR transfer and is not a substitute for credentialed and onchain browser E2E.

**Operational docs:** [Admin](docs/ADMIN_OPERATIONS.md) · [Sponsor](docs/TESTNET_SPONSOR_SETUP.md) · [Auth & recovery plan](docs/REAL_AUTH_ROLLOUT.md) · [Contract evidence](docs/TESTNET_EVIDENCE_2026-11-12.md) · [Threat model](docs/THREAT_MODEL.md).

## Security and scope

NEAR testnet currency is not money. Manufacturer/company and product names used in the demo are fictional. The public verifier proves **blockchain state**, not actual physical authenticity or legal ownership of a device. The new account-linked signing service and sponsor remain an experimental **centralized custody** design and are not suitable for holding real funds without user-controlled recovery, formal review and abuse monitoring.

**Repository:** https://github.com/victorkay97/RecallBond  
**Product:** https://recallbond.vercel.app/

### Hackathon open-signup rule

Email is collected but not verified. Login works immediately with email and password. Every new account has a **reserved** (unfunded) NEAR testnet address. A real administrator must explicitly mark it eligible for a **single capped sponsor activation** from the Admin Users tab, after reviewing the account; company approval is separate. No public form or API can grant admin permissions or sponsor funding by itself. Signed onchain actions require an actual active NEAR wallet. For minting and transferring NFTs, the receiver must supply their explicit 64-character NEAR address rather than an unverified email. Real-world deployment would require verified contact and wallet recovery before any valuable assets are involved.
