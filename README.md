# RecallBond

**Financial protection that follows the product.**

NEAR Hackathon 2026 · Primary track: **NFTs That Do Something**

RecallBond is a proof-of-concept for transferable digital product passports. A manufacturer issues a NEP-171 NFT to a product's owner and funds a product-batch recall campaign. The right to claim an **unclaimed** compensation entitlement follows the current NFT holder. A valid claim creates a beneficiary-specific credit that stays with that claimant even if ownership changes later.

## Core demonstration

1. A fictional manufacturer mints a product passport for Ada.
2. Ada transfers the NFT to Tomi.
3. The manufacturer funds and activates a batch recall campaign.
4. Ada tries to claim compensation and is rejected.
5. Tomi claims successfully and receives payout credit.
6. A duplicate claim is rejected.
7. Tomi withdraws compensation.

**Development status:** Contract source is preliminary and **not yet compiled, sandbox-tested, audited or deployed**. The local JavaScript reference state machine passed 12 tests on Nov 5, 2026. Do not send real funds to this contract.

## Layout

- `contract/` — Rust/NEAR SDK contract for NFT passports, campaign funding and withdrawals.
- `prototype/` — Interactive reference UX and an independent JavaScript state machine (to be uploaded).
- `docs/` — Security assumptions, build plan and submission checklist (to be uploaded).

## Contract validation

Install Rust and the wasm target, then:

```bash
cd contract
cargo test
cargo build --release --target wasm32-unknown-unknown
```

These commands are **instructions, not verified build results**. The GitHub Actions workflow will attempt the first actual Rust build.

## Safety boundaries

- This is a testnet-only hackathon prototype.
- No real manufacturer integrations, physical product authentication or enforceable commercial warranty are claimed.
- Sensitive serials and consumer information must not be placed onchain in cleartext.
- Claim authorization, reserve accounting, asynchronous payouts and callback security require deeper testing.

## References

- [NEAR hackathon](https://nearhackathon.com/)
- [NEAR NFT reference](https://github.com/near-examples/NFT)
- [NEP-171](https://github.com/near/NEPs/blob/master/neps/nep-0171.md)

## License

MIT.
