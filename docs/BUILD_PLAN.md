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

## Status
Source has not yet been compiled, sandbox tested or deployed. Do not send production assets to this contract.
