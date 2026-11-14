# NEAR testnet wallet sponsorship — operator runbook

**State:** code and database migration are installed. **Not live** until you create and fund a dedicated sponsor account, provide its secret through encrypted Vercel settings, and successfully complete an onchain transfer test.

## 1. Create the sponsor on your own Windows laptop

Your Windows PowerShell already has `near-cli-rs`. Run:

```powershell
near account create-account sponsor-by-faucet-service rb-sponsor-vk97-261114.testnet autogenerate-new-keypair save-to-keychain network-config testnet create
```

If the name is unavailable, choose another unique **.testnet** name. Confirm creation and save the **public** account ID and transaction hash in the operator evidence file. The key is saved in your local OS keychain. Do not post it to GitHub or chat.

Use the faucet-provided **testnet** balance; do not fund this with real NEAR.

## 2. Configure encrypted Vercel variables

In Vercel → `recallbond-demo` → Settings → Environment Variables:

- `RB_SPONSOR_ACCOUNT_ID` — the dedicated sponsor's exact public `*.testnet` account name.
- `RB_SPONSOR_PRIVATE_KEY` — the private signing key of *that sponsor only*, stored as **encrypted/sensitive**. Export locally using:
  ```powershell
  near account export-account rb-sponsor-vk97-261114.testnet using-private-key network-config testnet
  ```
  **Keep this value confidential**. Transfer it directly between your local computer and encrypted Vercel settings. Do not paste it in chat, documents, issues, source, or build logs.
- `RB_SPONSOR_DAILY_MAX` — `3` recommended for the demo; server enforces a maximum of 5 daily slots even if set higher.

Redeploy production after applying variables.

## 3. How it works

A registered person's wallet is initially **reserved**: it has a unique ED25519 key and implicit NEAR address but may not yet exist onchain. Wallet activation becomes possible only after:
1. Their email is verified by a real delivered code.
2. If they are a manufacturer, their organization has been independently reviewed and approved in the admin platform.
3. The dedicated sponsor is configured and has a safe balance.

The wallet endpoint `POST /api/wallet?action=activate` transfers **0.05 test NEAR** to a verified consumer's unique address, or **1.2 test NEAR** to a verified manufacturer (enough for contract storage deposits). These figures are restricted to testnet and can be adjusted after the demo. The transfer creates the implicit account onchain. A successful finalized account lookup changes wallet status from **reserved** to **active**.

The sponsor applies a **one-time per-user** activation record and unique daily funding slots. An unclear transaction outcome becomes **manual_review** and is never resent automatically, to avoid duplicate spending. Check the transaction and account onchain before taking manual action. Keep the sponsor topped up only with a small amount of *testnet* NEAR.

## 4. Signed actions remain a separate deployment milestone

Funding a wallet **does not** register a manufacturer with RecallBond's NEAR contract. Contract admin `rb-vk97-261112.testnet` must still register that new issuer from the operator's secure local environment. Do not upload that privileged contract-admin private key to Vercel.

Users should see onchain status, wallet address and demo-vs-real scope clearly. Signing credentials are stored AES-256-GCM encrypted in the backend; user account sessions cannot export the key in the current build. Before mainnet, use professionally hardened wallet signing, recovery, monitoring and audits.

## 5. Sponsor-safe smoke test

1. Configure email sender; register a new **real test email** and complete email confirmation.
2. Request wallet activation once, or let the account UI request activation after verification.
3. Confirm the status becomes `active` only when `view_account` finds the implicit account on NEAR testnet.
4. Verify the sponsor balance decreased by the correct testnet amount plus gas.
5. Repeat the request: it must not transfer again. Check daily caps with separately verified test users.
6. Test suspension: suspended accounts cannot log in, activate wallets or view personal data.
7. Never disclose sender, sponsor or wallet keys during the demo.
