# RecallBond — November 5 night handoff

**Current outcome:** Core contract passes 12 Rust unit tests and builds to optimized NEAR WASM. A real contract lifecycle executed on **local NEAR Sandbox protocol 86 (nearcore 2.13.0)**. JavaScript reference model passes 12 additional cases. Vercel hosts a **simulation**, not a testnet-connected wallet app.

## Ready without a laptop
- GitHub repository: https://github.com/victorkay97/RecallBond
- Interactive reference demo (simulated): https://recallbond-demo.vercel.app
- Validated NEAR Sandbox run: https://github.com/victorkay97/RecallBond/actions/runs/42107344770
- **Validated WASM artifact:** https://github.com/victorkay97/RecallBond/actions/runs/42107855010 (under Artifacts → `recallbond-sandbox-validated-wasm`). Stored from commit `576c6f089b4292905d8b393d554b9fe84668a675`.
- Artifact SHA-256 digest (GitHub zip envelope): `bac9e519456ee79390f9fc2ba5d44a2878109a139e94a31672c00ce4f89ac744`.
- **Artifact expires Nov 12, 2026.** Save the artifact before expiration, or reproduce the build from CI.
- GitHub workflow to rebuild and package validated WASM: https://github.com/victorkay97/RecallBond/actions/workflows/sandbox-check.yml
- Local test suite and deployment runbooks in this repository.
- Four GitHub issues track remaining work: #1 testnet deployment, #2 wallet-connected frontend, #3 security review, #4 submission.

## The exact tests that passed in NEAR Sandbox
1. `new(admin)` initializes an onchain contract.
2. Manufacturer is allowlisted, mints a passport to Ada.
3. Ada transfers the NFT to Tomi (NEP-171).
4. Issuer creates and fully funds a batch campaign.
5. Ada's former-owner claim is rejected.
6. Tomi successfully claims compensation.
7. Duplicate claim is rejected.
8. Tomi withdraws and contract accounting returns zero available credit.

### Why Sandbox initially failed
An obsolete near-workspaces JS library booted nearcore 2.6.2 / protocol 77, which cannot deserialize the WASM built by modern NEAR SDK. The integration harness now overrides only its binary-loader to select an official nearcore 2.13.0 / protocol 86 sandbox. No contract assertions are mocked or bypassed.

## Tomorrow (when wallet/device access is available)
1. **First:** Confirm the latest workflow is green and download the validated WASM artifact.
2. Create separate dedicated **testnet** accounts for contract/admin, issuer, Ada, Tomi. Do not share keys or use mainnet funds.
3. Deploy and initialize RecallBond contract to testnet. Follow [TESTNET_DEPLOYMENT.md](TESTNET_DEPLOYMENT.md).
4. Repeat actual mint, transfer, fund, reject old owner, claim, reject duplicate, withdraw. Save testnet explorer transaction URLs and contract ID.
5. Connect browser interface to NEAR testnet wallet and show correct pending/confirmed states. See issue #2.
6. Record demo and revise submission content only after real testnet behavior is verified.

## Before final submission
- Review async callback and `nft_transfer_call` races (issue #3).
- Confirm no private keys or secrets in any repo file, history or logs.
- Include exact clone/build/reproduce steps and real testnet evidence.
- Prepare X video/screenshots with @NEARProtocol and #NEARHackathon.
- Submit by **November 14, 2026 at 23:59 UTC** (November 15, 2026 at 00:59 WAT).

## Scope and caution
No real product authentication, consumer insurance, legal warranty or real-money system is implemented. Only fictional manufacturers and products are shown. Never use this experimental contract for real funds without an independent security review.
