# RecallBond — NEAR testnet wallet-signing handoff (12 November 2026)

## Verified accounts and baseline

- Contract: `rb-vk97-261112.testnet`; issuer: `novatech-vk97-261112.testnet`; demo consumer: `tomi-vk97-261112.testnet`.
- Passport `RB-NV-002891`, campaign #0, batch `BATTERY-X21`: already claimed and settled. **Never re-fund or activate campaign #0.**
- [Recorded signed transaction evidence](TESTNET_EVIDENCE_2026-11-12.md).

## Implemented wallet-driven actions

- Consumer > Wallet: connect an existing NEAR testnet wallet, view actual balance/owned passports/credit; review and approve owner-signed NFT transfers, eligible compensation claims, or credit withdrawal.
- Business > Products: connect the registered issuer wallet only; mint a new testnet passport to a specified account in a new batch with a randomized SHA-256 demo commitment and 1 testnet NEAR storage deposit.
- Business > Recalls: issuer-only creation, exact-reserve funding, and activation of **new** campaigns (campaign ID >0), each requiring separate wallet approvals.
- Existing NovaTech and Tomi examples are public data, **not** an authenticated session.
- Wallet API is pinned to `@hot-labs/near-connect@0.12.0` loaded from esm.sh. Keys and seeds stay in the chosen wallet. No password or private key is requested by RecallBond.

## Operator smoke test still required

1. On Business > Products, connect `novatech-vk97-261112.testnet` with a wallet supporting testnet. Non-issuer accounts must remain read-only.
2. Choose a unique test token ID, a NEW batch (`BATCH-2026-11-B`, not frozen `BATTERY-X21`), a fictional title, and a testnet account under your control. Read the method and attached deposit in the wallet and approve only if correct.
3. Verify the minted passport by refreshed NEAR RPC or explorer **before** retrying anything.
4. Create a new recall, capture its returned campaign ID; fund exactly the remaining liability; activate only when fully funded.
5. Connect the new token holder on Consumer > Wallet, then verify claim and withdrawal separately via the chain.
6. Record hashes, receipt outcomes and real browser screenshots. Never call a wallet popup alone proof of payment.

## Limitations

- **Browser wallet-signing E2E with an actual human wallet is not yet independently verified.** CI covers JS helpers and browser UI only; it deliberately does not sign live transactions.
- Signup does not automatically create wallets or register real manufacturer organizations; NEAR embedded wallet provisioning and secure key recovery still need integration.
- Defect reports and manufacturer case-review workflow remain browser-local storage. No authenticated backend, persistent shared issue inbox or real photo uploads yet.
- Minting creates a random test-only commitment instead of collecting/storing a real device serial; don't use it for commercial device authentication.
- The consumer example portfolio and simulated claim credits remain visually distinguished from actual onchain records.
- Runtime CDN import is suitable for the hackathon prototype, not an audited production dependency. Pin/bundle SDK source and establish CSP for production.

**Security:** testnet only; inspect every signed method/deposit; never share wallet secret keys, mnemonics or recovery phrases.