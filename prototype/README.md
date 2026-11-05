# RecallBond interactive reference

A **local-only** browser simulator used to demonstrate the intended ownership/claim behavior. It does not connect to NEAR. All money values are simulated.

## Preview routes
- `/` — original seven-step product passport and recall demonstration
- `/business/` — manufacturer dashboard preview (fictional NovaTech)
- `/app/` — consumer dashboard preview with product lifecycle, wallet-vs-credit distinction and local archive
- `/verify/` — public verification page with no login and no owner identity
- Sample lookup ID: `RB-NV-002891`

These are standalone **product design previews**. Email/password accounts, embedded wallets, real manufacturer verification, claims and registration are **not** implemented in these screens. For the reviewed business rules, see [product specification](../docs/PRODUCT_SPEC_V0.2.md).

Live preview: https://recallbond-demo.vercel.app


Run the tests:
```bash
node --test ledger.test.mjs
```

Run the demo with a local HTTP server (the browser ES modules require serving over HTTP):
```bash
python3 -m http.server 4173
```
Then open http://localhost:4173/ .

Do not describe these tests or visuals as proof of deployed NEAR smart contracts.
