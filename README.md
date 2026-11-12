# RecallBond
**Financial protection that follows the product.**

A NEAR Hackathon 2026 project · Primary track: **NFTs That Do Something**

RecallBond demonstrates transferable digital product passports with actual financial logic. A manufacturer registers a product passport as a NEP-171 NFT and funds a recall campaign. Unclaimed compensation eligibility belongs to the **current** token owner. Once a valid claim is made, the approved credit remains with that claimant even if the passport is transferred again.

## Seven-step demo
1. Fictional manufacturer NovaTech issues a product passport to Ada.
2. Ada transfers it to Tomi.
3. NovaTech creates and fully funds a recall campaign for the product batch.
4. Ada attempts a claim and is rejected.
5. Tomi claims and receives approved compensation credit.
6. Tomi's second attempt is rejected.
7. Tomi withdraws the approved amount.

The preferred demo address is **[recallbond.vercel.app](https://recallbond.vercel.app/)**. The original `recallbond-demo.vercel.app` URL remains valid for existing links.

## Live demo and product experiences

- [RecallBond landing page](https://recallbond.vercel.app/) — manufacturer or consumer entry point.
- [NovaTech business workspace](https://recallbond.vercel.app/business/) — fictional company dashboard with **real read-only NEAR testnet** passport and recall data plus experimental issuer-signed testnet actions. Actual organization onboarding remains incomplete.
- [Consumer app](https://recallbond.vercel.app/app/) — responsive consumer experience with experimental wallet-signed testnet actions; sample product and defect-report workflows are still browser-only previews.
- [Public passport verification](https://recallbond.vercel.app/verify/) — real unauthenticated read-only `get_product` query for `RB-NV-002891` on `rb-vk97-261112.testnet`.
- [Full verified testnet evidence](docs/TESTNET_EVIDENCE_2026-11-12.md) — operator-confirmed deployment, mint, transfer, campaign creation/funding/activation, rejected claims, successful claim and finalized NEAR payout.

The Rust contract and its demonstrated payout are **real on testnet**. Wallet-signing flows are experimental and have not yet completed a human-wallet browser E2E test; sample workflows are not onchain. The fictional NovaTech manufacturer, products and named consumers are demonstration data. All testnet NEAR is valueless.

### Run locally

```sh
cd prototype
python3 -m http.server 4173
# open http://localhost:4173/
```

```sh
cd prototype
npm test
```

The prototype's user-facing defect report and manufacturer review remain a browser-local demonstration, not an authenticated backend. No wallet secrets or private serial numbers are stored by this demo.

## Experimental NEAR testnet wallet signing (November 12, 2026)

The redesigned Business and Consumer views now have a separate **experimental transaction-signing workspace**, using an existing user-selected NEAR testnet wallet. Consumer actions include verified-owner passport transfer, eligible recall claim, and claimant credit withdrawal. The NovaTech issuer account can sign testnet passport issuance and new recall creation, funding and activation. All privileged operations are gated by the real connected onchain account and require separate wallet approval.

These **browser-connected signing flows have not yet been exercised end-to-end with a human wallet**, even though the Rust contract lifecycle was independently completed via NEAR CLI and the UI/amount-handling tests pass. The existing campaign #0 is already paid and must not be funded or claimed again. A new testnet batch and fresh campaign are needed for a full browser smoke test. See [browser wallet signing handoff](docs/WALLET_SIGNING_HANDOFF_2026-11-12.md).

**Not implemented:** automatic wallet/account creation on signup, backend-authenticated manufacturer registration, shared customer account data, and durable issue-report processing. The issue-reporting demo still runs in localStorage and must not be described as live support. No real wallet recovery phrases or keys are processed by this site.

## Consumer-initiated defect reporting (browser-only preview)

In addition to manufacturer-funded recall compensation, the consumer app now demonstrates **Report an issue** from a selected product passport. A fictional manufacturer can review the case under **Business → Claims**, record an example repair/replacement decision and show its status back in the consumer app.

- Open [Consumer My Products](https://recallbond.vercel.app/app/#collection) and [Manufacturer Claims](https://recallbond.vercel.app/business/#claims) on the **same browser and site origin** to walk through the flow.
- The new defect-case system is a **localStorage simulation**, not a real support inbox. It does not authenticate users, verify warranties, upload photos, inspect evidence, send manufacturer notifications or alter NEAR funds.
- The image picker is demonstration-only and stores **no photo**. Do not enter sensitive personal information.
- See [Defect Claims MVP](docs/DEFECT_CLAIMS_MVP.md) and [Laptop handoff](docs/LAPTOP_HANDOFF_2026-11-12.md).

## Optional public NEAR testnet lookup

The [Verify surface](https://recallbond.vercel.app/verify/) also has a separate **opt-in, read-only testnet lookup**. Enter the deployed contract account and passport token ID to call the contract's `get_product` method through public NEAR testnet RPC. It displays the user-supplied contract, contract-reported manufacturer account, batch and token ID, **not** the owner account or serial commitment. No wallet or signing is used. The verified contract and passport are prefilled in the live lookup, while the separate sample cards remain fictional. An arbitrary contract's response is not proof of official manufacturer endorsement.

## Smart contract — deployed on NEAR testnet
`contract/src/lib.rs` implements a preliminary Rust NEAR SDK version using the NEP-171 standard. It includes:

- Manufacturer allowlisting and unique serial commitments.
- NFT issuance and transfers.
- Frozen recall batches and fully funded campaigns.
- Current-owner claim authorization, one claim per passport and campaign.
- Claimant-specific withdrawal credit and a private asynchronous transfer callback.

Requires a Rust toolchain and `wasm32-unknown-unknown`:

```sh
cd contract
cargo test --all-targets
cargo build --release --target wasm32-unknown-unknown
```

**Contract status (Nov 12, 2026):** Rust unit tests, release WASM and NEAR Sandbox end-to-end checks passed. The actual contract was deployed and exercised on **public NEAR testnet**. The 0.1 test NEAR payout finalized with callback `true`; the claimant's remaining credit is zero. See [testnet evidence](docs/TESTNET_EVIDENCE_2026-11-12.md). Wallet-connected browser transaction forms, secure manufacturer/consumer authentication and a security audit are **not yet complete**. Do not use real funds or deploy to mainnet.

## Product direction (November 2026)

**Current visual prototype:** Mobile-first, wallet-inspired interface with Enjin-influenced collectible 3D product passports, local QR-code generation, floating mobile bottom navigation, desktop expanded layouts and real interaction previews. See [UI Direction v0.3](docs/UI_DIRECTION_V0.3.md).

Three user surfaces are defined in [Product Spec v0.2](docs/PRODUCT_SPEC_V0.2.md):

- **RecallBond Business:** manufacturers issue passports and create funded recall campaigns.
- **RecallBond Consumer:** users register products, view protection, request transfers and manage compensation and a linked NEAR wallet.
- **RecallBond Verify:** public, login-free passport lookup without exposing consumer names, emails, or raw IMEI numbers.

The Vercel project includes **simulated previews** at [Business](https://recallbond.vercel.app/business/), [Consumer](https://recallbond.vercel.app/app/), and [Verify](https://recallbond.vercel.app/verify/). The Business and Consumer screens are not yet authenticated or capable of signing transactions, though Business and Verify now retrieve **real read-only testnet data**. The complete contract claim-and-payout flow was independently verified on public testnet.

## Source layout
- [contract/](contract/) — NEAR NFT + funded recall contract, 12 Rust unit tests, WASM build and CI.
- [integration/](integration/) — NEAR Sandbox E2E scenario for real contract execution under protocol 86.
- [prototype/](prototype/) — interactive browser walkthrough, independent JavaScript state machine and 12 tests.
- [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) — development milestones and acceptance criteria.
- [docs/TESTNET_DEPLOYMENT.md](docs/TESTNET_DEPLOYMENT.md) — wallet-safe testnet deployment runbook.
- [docs/JUDGE_WALKTHROUGH.md](docs/JUDGE_WALKTHROUGH.md) — reproducible judge demonstration.
- [docs/HACKATHON_PITCH.md](docs/HACKATHON_PITCH.md) — draft submission and X post, on hold pending testnet proof.
- [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) — trust assumptions and adversarial test plan.
- [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) — NEAR Hackathon requirements.

## Product boundaries
This prototype does **not** authenticate physical possession, provide enforceable commercial warranties, verify actual manufacturers, integrate banking payouts, or constitute audited financial software. Sensitive serial numbers and personal data should not be published onchain.

## Hackathon
- Official event: https://nearhackathon.com/
- Official NFT reference: https://github.com/near-examples/NFT
- NEP-171: https://github.com/near/NEPs/blob/master/neps/nep-0171.md
- Submission deadline: **Nov 14, 2026, 23:59 UTC**.
- Required before submission: public repo, public X demo post and submission form.

## License
MIT — see [LICENSE](LICENSE).
