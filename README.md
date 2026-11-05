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

## Quickstart — runnable browser simulation
From the repository root:

```sh
cd prototype
python3 -m http.server 4173
```

Visit **http://localhost:4173** and advance through the seven steps. This is a deterministic local reference model, **not a blockchain-connected application**. All money values displayed are simulated.

Run its tests separately:

```sh
cd prototype
node --test ledger.test.mjs
```

The 12 reference-model cases passed locally on Nov 5, 2026. GitHub Actions runs them again on pushes to `prototype/`.

## Smart contract — work in progress
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

**Contract status (Nov 5, 2026):** Rust unit tests (12/12), optimized WASM build and a full **NEAR Sandbox protocol-86 end-to-end execution** have passed in GitHub Actions. See [the green Sandbox run](https://github.com/victorkay97/RecallBond/actions/runs/42107344770). **Public NEAR testnet deployment, wallet-connected UI and a security audit remain incomplete.** Do not use real funds or deploy to mainnet.

## Product direction (November 2026)

Three user surfaces are defined in [Product Spec v0.2](docs/PRODUCT_SPEC_V0.2.md):

- **RecallBond Business:** manufacturers issue passports and create funded recall campaigns.
- **RecallBond Consumer:** users register products, view protection, request transfers and manage compensation and a linked NEAR wallet.
- **RecallBond Verify:** public, login-free passport lookup without exposing consumer names, emails, or raw IMEI numbers.

The Vercel prototype now includes **simulated previews** at [Business](https://recallbond-demo.vercel.app/business/), [Consumer](https://recallbond-demo.vercel.app/app/), and [Verify](https://recallbond-demo.vercel.app/verify/). These screens are **not** yet authenticated or connected to the NEAR contract; the separately tested original claim flow remains the only onchain mechanism validated in Sandbox.

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
