# RecallBond web prototype

The public frontend is deployed at https://recallbond.vercel.app/. It contains three product surfaces:

- [Public verifier](https://recallbond.vercel.app/verify/) — **real, unauthenticated, read-only** NEAR testnet passport lookup with actual transaction receipts and the minimalist NFT cover. Sample-record preview is separately labeled fictional.
- [Consumer app](https://recallbond.vercel.app/app/) — mobile-first wallet/passport concept, with simple NEAR/RecallBond cover art and existing tap-to-flip QR verification. Experimental real onchain wallet-signed actions are available, but require an external testnet wallet.
- [NovaTech business dashboard](https://recallbond.vercel.app/business/) — fictional manufacturer workspace with real public onchain stats and experimental signed issuance / recall transaction forms.

**Important boundaries:** Email/password user registration, automatic NEAR wallet provisioning, authenticated company onboarding, secure shared defect-report storage, and account recovery are **not implemented**. Defect reports and sample outcomes currently remain browser-local; they are not real manufacturer support tickets or a cash payout.

## Try the demo

```sh
cd prototype
npm test
python3 -m http.server 4173
# http://localhost:4173/
```

For browser E2E tests:

```sh
cd prototype
npm install
npx playwright install chromium
npm run test:ui
```

- [Verified NEAR testnet evidence](../docs/TESTNET_EVIDENCE_2026-11-12.md)
- [Real signup and wallet architecture plan](../docs/ACCOUNT_LINKED_WALLET_ARCHITECTURE.md)
- [Defect reporting scope](../docs/DEFECT_CLAIMS_MVP.md)

Never paste wallet private keys, seed phrases, passwords or real device serials into the prototype. NEAR testnet currency has no real-money value.
