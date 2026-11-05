# RecallBond — judge's reproducible walkthrough

## The problem in one sentence
Warranties and recall compensation often depend on fragmented purchase records; a secondhand owner may struggle to prove and exercise transferable protection.

## What RecallBond changes
A product's NEP-171 token records passport ownership. A manufacturer funds a recall reserve before the campaign is activated. Before a claim, current NFT ownership determines who can claim; after a successful claim, the approved credit belongs to that claimant. Each passport can claim at most once per campaign.

## What to test
The live deployment will eventually provide explicit contract account IDs and testnet transaction links. Until then, the [reference demo](../prototype/) illustrates this exact sequence **without pretending to move money**.

| Step | Action | Expected result |
|---|---|---|
| 1 | Mint passport to Ada | Owner is Ada |
| 2 | Transfer passport to Tomi | Current owner is Tomi |
| 3 | Fully fund campaign | Reserve matches maximum claim liability |
| 4 | Claim as Ada | Rejected |
| 5 | Claim as Tomi | Approved |
| 6 | Claim as Tomi again | Rejected |
| 7 | Withdraw as Tomi | Credit spent once; onchain payout is verifiable |

## Contract invariants
- Eligibility is based on ownership at claim time.
- Batch is frozen when a campaign is created.
- Campaign cannot be activated without full compensation funding.
- An entitlement is one-use per (campaign, token).
- Approved credit is bound to its original claimant after further NFT transfers.
- Failed withdrawal must restore available credit through a private callback.

## Commands
```sh
cd prototype && npm test
cd ../contract && cargo test --all-targets && cargo build --release --target wasm32-unknown-unknown
```

At this stage, the browser demo is a **simulation**. Rust unit tests and WASM compilation are not equivalent to a deployed testnet contract or a security audit.

## Why NEAR?
The NFT standard provides transferable registered ownership; NEAR's smart-contract state machine can enforce claim eligibility and reserve-backed payout accounting between parties who should not have to trust the website's database.

## Boundaries
No manufacturer or physical product authenticity is independently verified. The demo's manufacturer and products are fictional. The protocol does not create legally enforceable warranty rights without participating issuers and valid contracts. Don't use with real funds.
