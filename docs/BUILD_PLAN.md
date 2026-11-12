# RecallBond — Build plan

## MVP outcome
A registered manufacturer mints a product passport on NEAR. Its current owner can claim one funded compensation entitlement. After transfer, the previous owner cannot claim; an already approved claim stays with its original claimant.

## Gates
1. **Rust correctness:** CI compiles Rust, passes unit tests, builds WASM.
2. **NEAR sandbox:** reproduce mint, transfer, campaign, claim, failure, withdrawal and payout callback scenarios in a local sandbox.
3. **Testnet:** deploy with fictional accounts and testnet funds only. Record contract address and transactions in the README.
4. **UI:** connect manufacturer and consumer views to real wallet-signed contract calls. Replace simulated values with labeled onchain state.
5. **Submission:** public repo, reproducible setup, recorded demo, X post and NEAR submission before 14 Nov 2026 23:59 UTC.

## Non-goals
Real warranty legal coverage, physical serial verification, insurance underwriting, bank payouts, KYC, cross-chain swaps, autonomous AI or a production custody system.

## Product flow
- Admin permits a manufacturer account.
- Manufacturer issues a product NFT with batch and serial commitment.
- Product NFT is transferred.
- Manufacturer creates a recall campaign for a frozen batch.
- Manufacturer fully funds maximum liability, then activates campaign.
- Current token owner claims once per campaign.
- Claim credit is fixed to claimant; withdrawal follows a checked callback.
- Expired unclaimed reserve becomes refundable to manufacturer.

## Acceptance tests
Old-owner rejection; eligible-owner claim; duplicate claim rejection; insufficient funding rejection; campaign freeze; serial duplicate rejection; authorization; expired campaigns; withdraw failure recovery; reserve reconciliation.

## Verified versus outstanding (as of 12 November 2026)
- **Completed previously:** 12 Rust unit tests, optimized WASM build and NEAR Sandbox protocol-86 integration demonstration, per [README](../README.md) and the linked GitHub Actions proof.
- **Browser prototype:** Consumer, Business and Verify are simulations; browser-only defect-case workflow added on a feature branch; do not mistake it for verified manufacturer decisions.
- **Remaining P0:** Public NEAR testnet deployment with recorded transaction IDs; wallet-connected signed actions where feasible; reproducible walkthrough; latest CI verification; demo recording; public X post; official submission.
- **Security:** No real funds or production private keys in this prototype; contract is unaudited.
- **Hackathon scope rule:** Do not modify the payment contract just to make a fictional warranty approval trigger compensation. The manufacturer-funded recall mechanism is the primary onchain demo.

See [Defect Claims MVP](DEFECT_CLAIMS_MVP.md) and [Laptop handoff](LAPTOP_HANDOFF_2026-11-12.md).
