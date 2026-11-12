# RecallBond — testnet deployment runbook

**Target:** NEAR **testnet only**. Do not use mainnet or real funds.

## Before touching a wallet

1. Confirm both GitHub checks are green: Rust tests + WASM build, and the JavaScript reference tests.
2. Review [threat model](THREAT_MODEL.md) and changes since the last green build.
3. Use a new dedicated testnet account for the contract and separate accounts for **issuer**, **Ada**, and **Tomi**. Do not put secret keys in GitHub, Vercel, screenshots or chat.
4. Never reuse a mainnet private key as a convenient test credential.

## Build locally (Windows via WSL2 is recommended)

Clone the public repository and install Rust and the WASM target.

```bash
git clone https://github.com/victorkay97/RecallBond.git
cd RecallBond/contract
rustup target add wasm32-unknown-unknown
cargo test --all-targets
cargo build --release --target wasm32-unknown-unknown
```

To use NEAR's recommended contract tool, install `cargo-near` following https://github.com/near/cargo-near and run:

```bash
cargo near build
cargo near create-dev-account
cargo near deploy
```

The deployment command is interactive. Select **testnet**, a fresh contract account, and the correct WASM artifact; read the screen before signing. The testnet account needs enough test NEAR to cover contract storage and transactions. Never paste seed phrases or private keys into this repository.

## Initialization

Initialize with `new(admin: AccountId)` using the intended administrative testnet account. A deployed contract is unusable until initialized.

Sample JSON argument:

```json
{"admin":"YOUR_ADMIN.testnet"}
```

Call `register_manufacturer` from the **admin account** with a storage deposit, using the issuer's testnet account ID.

```json
{"manufacturer":"YOUR_ISSUER.testnet"}
```

## The demonstration order

1. Issuer mints a product passport to Ada. Supply `token_id`, `owner_id`, `batch_id`, 64-hex-character **salted** serial commitment, and NEP-171 token metadata. Mint requires a storage deposit.
2. Ada calls `nft_transfer` to Tomi with **exactly 1 yoctoNEAR** attached.
3. Issuer creates a campaign for the batch with `payout_yocto` as a decimal string and `expiry_ns` strictly in the future. Campaign creation requires storage deposit.
4. Issuer calls `fund_campaign(campaign_id)`, attaching exactly the full maximum liability amount in yoctoNEAR.
5. Issuer activates the campaign. `get_campaign` should report it active and fully funded.
6. Ada attempts `claim_compensation` and is rejected (she is the former owner).
7. Tomi successfully claims, attaching enough test NEAR for new claim storage. `get_credit` and `get_claimant` should show the entitlement.
8. Tomi's duplicate claim is rejected.
9. Tomi calls `withdraw_compensation`. Check the transaction and follow-up callback in the explorer. Do not show the payment as completed until the NEAR execution result is final.

## Evidence to capture for the submission

- Contract account ID and NEAR testnet explorer URL.
- The deployed transaction hash and current contract commit SHA.
- NFT mint and ownership-transfer transactions.
- Campaign funding and activation transactions.
- One rejected former-owner claim and one rejected duplicate claim.
- The approved beneficiary claim and completed withdrawal transaction.
- A GitHub Actions green workflow URL.
- A <3 minute walkthrough video, with the account IDs redacted appropriately and no credentials exposed.

## Troubleshooting

- **Unknown account**: verify testnet versus mainnet and exact account IDs.
- **Not initialized**: call `new` before using other methods.
- **Missing deposit**: storage writes require an attached deposit.
- **Transfer rejected**: current owner must authorize, and NFT transfers require 1 yoctoNEAR.
- **Campaign cannot activate**: full liability must be funded.
- **Claim rejected**: check campaign status, expiry, batch and current NFT ownership.
- **Withdrawal fails**: check promise/callback outcome and restored claim credit; do not repeatedly transfer while result is unknown.

## No-laptop limitation

The account creation, contract initialization, and owner-signed calls require valid testnet authorization. They must not be automated with exposed private keys in a public GitHub Action. This runbook deliberately leaves wallet authorization to the account owner.

## Faster artifact-based deployment (after green CI)
The `RecallBond contract checks` workflow uploads `recallbond-testnet-wasm`, including the Rust-compiled `recallbond.wasm` and its SHA-256 checksum. Download it from the **green workflow run for the exact commit being deployed** and verify the checksum before any signed testnet transaction. This avoids a local Rust compilation requirement. GitHub Actions artifacts have a 7-day retention window.

PowerShell verification after extracting the artifact:

```powershell
Get-FileHash .\\recallbond.wasm -Algorithm SHA256
Get-Content .\\recallbond.wasm.sha256
```

The digest must match. The artifact contains **code only**, never wallet keys. A local signing wallet or an authenticated wallet session remains necessary.
