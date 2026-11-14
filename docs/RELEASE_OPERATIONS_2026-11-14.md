# RecallBond — operator go-live checklist (14 November 2026)

This is a gated, **testnet-only** release checklist. A green GitHub build is not evidence that real emails, funded wallets, onchain signing and payout all work. The publicly accessible NovaTech/consumer examples are **sample experiences**.

## Current verified baseline

- GitHub working branch: `feat/admin-workspace-and-judge-onboarding-20261114`; do not merge before the checks below pass.
- Neon project: `recallbond-testnet-auth`; schema migrations for admin, sponsorship and verification exist.
- Observed database baseline on 14 November: **2 accounts** (1 consumer, 1 manufacturer), **2 reserved wallets**, **0 email-verified users**, **0 admin memberships**, **0 wallet activations**, **0 issue reports**.
- Vercel project: `recallbond-demo`; only `DATABASE_URL` and `RB_WALLET_MASTER_KEY` were configured when this checklist was written.
- Existing onchain sample transactions (Ada to Tomi, funded recall, claim and payout) remain valid, but they were not made through the newly integrated browser-account flow.

## Gate A: configure ZeptoMail without sharing the secret

1. Open [ZeptoMail](https://zeptomail.zoho.com/) and sign in with the account controlling RecallBond's sender domain.
2. Choose or create a dedicated **Mail Agent** for RecallBond verification email.
3. Under the Agent's **Domains**, add your sending domain and complete the DNS checks (SPF/DKIM/CNAME as shown). Under **Sender Address**, use a verified address, such as an inbox on that domain. Do not use an unverified from-address.
4. In that Agent, open **SMTP/API → API** and copy the **Send API key**. The official path is **Agents → SMTP/API → Send API key** ([ZeptoMail help](https://www.zoho.com/zeptomail/help/api-home.html)). It is *not* a regular Zoho OAuth client secret, API admin token or SMTP password.
5. In [Vercel](https://vercel.com/), select **recallbond-demo → Settings → Environment Variables** and add:
   - `RB_ZEPTO_SEND_API_KEY` — the Agent's Send API key; code handles either the raw key or a copied value prefixed with `Zoho-enczapikey `.
   - `RB_MAIL_FROM` — the verified sender address; not the Agent name.
6. Mark the API key sensitive/encrypted, target the environment you will test (Preview and/or Production), then redeploy the corresponding branch. **Do not paste the key into chat, GitHub, logs or a public form.**
7. Use a real test account to request a code; check delivery, confirmation, expiry, wrong-code rejection and 90-second resend limit. The account must change from unverified to verified.

## Gate B: create a separate NEAR testnet sponsor on Windows

1. On your own Windows PowerShell, check `near --version` and use `near-cli-rs`.
2. Create a dedicated account **different from the deployed contract and its admin/issuer keys**:

   ```powershell
   near account create-account sponsor-by-faucet-service rb-sponsor-vk97-261114.testnet autogenerate-new-keypair save-to-keychain network-config testnet create
   ```

   If the name is taken, choose a unique `*.testnet` name. Save only its *public* account ID and transaction URL in the evidence log. NEAR documents this exact CLI command shape in [near-cli-rs guide](https://github.com/near/near-cli-rs/blob/main/docs/GUIDE.en.md).
3. Confirm the sponsor has a small testnet balance. Do **not** fund it with real funds or use the RecallBond contract administrator key.
4. Export the sponsor signing key **locally** using `near account export-account <your-sponsor.testnet> using-private-key network-config testnet`. Do not share its output here.
5. In Vercel's encrypted Environment Variables add `RB_SPONSOR_ACCOUNT_ID`, `RB_SPONSOR_PRIVATE_KEY` and `RB_SPONSOR_DAILY_MAX=3`, with the correct Preview/Production targets. Redeploy after saving.
6. With a verified consumer, activate the reserved implicit wallet. Expect a **one-time 0.05 test NEAR** transfer, an onchain account and active status. A verified platform-approved manufacturer receives **1.2 test NEAR** once. Repeated activation must **not** transfer again; uncertain transfers remain for manual review.
7. Inspect the sponsor account on the testnet explorer and verify balance decreases and no repeated credits. Never publish the secret key.

## Gate C: bootstrap the first actual administrator

1. Register a personal operator account and verify its email using the new sender.
2. With trusted Neon database access, inspect the account and grant `rb_admin_memberships` **only after** confirming the exact personal email. Follow [ADMIN_OPERATIONS.md](ADMIN_OPERATIONS.md).
3. Visit `/admin/` and confirm real account counts, company approval, suspension, issue-review actions and the audit log. Unprivileged and unverified accounts must receive 403 from the admin API.
4. Platform company approval **does not** make the account an onchain issuer. Register a manufacturer separately through the contract administrator's own locally held key; never upload that key to Vercel.

## Gate D: full onchain browser E2E — NEW disposable accounts and batch

- [ ] Create distinct verified, active consumer and manufacturer users; company approved in platform and its wallet registered onchain as issuer.
- [ ] Manufacturer mints a **new** NFT passport for the consumer; record its real token ID and transaction.
- [ ] Verify the public passport owner matches the intended account and no plaintext serial is exposed.
- [ ] Transfer to a second verified, active consumer; confirm actual NEAR ownership changes.
- [ ] Start a **new** recall campaign for that minted batch, fund **the exact maximum liability**, then activate it.
- [ ] Former owner cannot claim. Current owner claims once. A second claim is rejected. Credit is visible to the claimant.
- [ ] Withdraw credited test NEAR; confirm final transaction and zero remaining claimant credit.
- [ ] Have current owner report a device issue; manufacturer reviews the durable ticket; consumer sees the saved outcome. Verify a support approval does **not** silently pay out NEAR.
- [ ] Suspend a disposable account from Admin; confirm its sessions are revoked and actions blocked.
- [ ] Save transaction hashes and screenshots in a **secret-free** judge evidence log.

Do not reuse previously claimed campaign #0 for this test; its compensation has been paid out.

## Automated gate: safe live smoke

From `prototype/`:

```powershell
npm install
$env:RB_SMOKE_BASE_URL = "https://YOUR-BRANCH-DEPLOYMENT.vercel.app"
npm run test:live
```

It checks deployed routes, database health and unauthorized API boundaries. It does **not** submit any blockchain transaction. To additionally verify real account sign-in and read access, set matching private environment variables `RB_SMOKE_CONSUMER_EMAIL/PASSWORD`, `RB_SMOKE_MANUFACTURER_EMAIL/PASSWORD`, and (optional) `RB_SMOKE_ADMIN_EMAIL/PASSWORD` locally. Do **not** put those credentials in source control or unprotected CI. The sign-in checks create temporary sessions, but do not fund wallets or change contract state.

A passing smoke test with credentials absent is only a **public-route/security-boundary** check, not a complete end-to-end pass.

## Gate E: judge accounts and deployment

- [ ] Prepare a disposable, verified **consumer** and **manufacturer** login with funded testnet wallets. Share passwords only through the hackathon's private judge submission field; do not grant administrator privileges or publish them on GitHub.
- [ ] Give judges a 2–3 minute route: sample consumer/manufacturer → public real passport verifier → signed production workflow → funded recall proof → issue review. Keep demo content labeled fictional.
- [ ] Add a note to the private submission identifying the distinction between already-proven operator transactions and newly tested browser transactions.
- [ ] Revoke disposable judge sessions and rotate their passwords after judging.
- [ ] Only after CI, mobile smoke, true account E2E and security checks pass: merge the reviewed feature branch into `main`, verify **Production** Vercel uses that commit and confirm `https://recallbond.vercel.app/` actually serves it.

## Stop / rollback conditions

If the ZeptoMail key is missing, do not mark email verified. If the sponsor's state or outcome is uncertain, do not resend funds automatically. If an account-signed contract transaction fails or its receipt cannot be reconciled, record the token/tx and investigate before re-issuing. Do not advertise the application as fully tested or submission-ready based on a preview build, static tests, or sample browser storage alone.
