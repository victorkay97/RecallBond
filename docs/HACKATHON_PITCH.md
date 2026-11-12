# RecallBond — hackathon submission material (DRAFT; do not submit before testnet proof)

## One-liner
**RecallBond makes product protection transferable: when a product changes owners, its unclaimed, manufacturer-funded recall compensation follows the new owner.**

## Proposed application description
Every year, consumers buy secondhand electronics whose warranty and recall benefits may be difficult to verify or transfer. RecallBond explores a digital product passport that carries a financial right instead of merely displaying warranty text.

Using NEAR's NEP-171 NFT standard, a fictional manufacturer registers products, creates a recall program for a fixed batch, and funds the full potential compensation liability before activating it. The current passport owner can claim once. Transfer the NFT before claiming, and the entitlement changes hands. Claim successfully, and the approved credit is locked to that claimant. The protocol rejects former-owner claims, duplicate claims, and attempts to expand an already frozen eligible batch. Payouts use native NEAR contract transfers with a private completion callback.

Our demonstration focuses on something judges can reproduce: mint → transfer → fund recall → reject old owner → approve current owner → reject duplicate → withdraw. We include Rust unit tests, a WASM build, an interactive local reference demo, and a security threat model.

The current prototype does **not** establish physical authenticity or an enforceable commercial warranty. All products and manufacturers in the demonstration are fictional. We use NEAR testnet only.

## New supporting user story (browser demo, not onchain)

The manufacturer-led flow begins when an issuer identifies a faulty batch and funds recall compensation. The complementary consumer-led flow begins when a registered product holder notices a problem, such as a new green line on a phone display, and reports it against the passport. The manufacturer can review the example case and record a **fictional** repair or replacement outcome. This human support flow is browser-local and is **not** a verified warranty decision or NEAR payment.

Potential long-term value: link repeat defect reports to verified manufacturers so they can investigate a pattern and voluntarily create a fully funded recall. The only onchain financial promise demonstrated by the project remains the current-holder funded recall entitlement, not conditional complaint-based payouts.

**Judge demo order:** Start with a quick consumer report → fictional manufacturer status update (20–35s), then spend the **majority** of the demo proving the NEAR NFT transfer, funded batch recall, former-owner rejection, current-owner claim, duplicate rejection and withdrawal.

## X launch-post draft — HOLD until real onchain demo is complete
We built RecallBond for #NEARHackathon.

What if a product's financial protection could follow whoever owns it—even after resale?

RecallBond turns a product passport into a funded claim right. Transfer the NFT, transfer the unclaimed eligibility. Once claimed, compensation belongs to that claimant.

We demo the entire cycle on NEAR: product registration, transfer, recall funding, authorized payout, and rejected duplicate claims.

@NEARProtocol

[Attach tested demo video/screenshots, public repository and testnet evidence before posting.]

## Suggested short demo narration
"Buying a secondhand device shouldn't mean losing the protection attached to it. This is a fictional NovaTech laptop, registered with a RecallBond digital passport. Ada owns it first. She transfers it to Tomi. NovaTech announces a funded recall. Ada tries to claim and fails because she no longer holds the passport. Tomi claims successfully, and the approved payment becomes his even if the NFT moves again. A second claim is rejected. Finally, Tomi withdraws the compensation, which we can verify through NEAR's testnet transactions. RecallBond turns transferable ownership into a financial right."

## Evidence before publication
- [ ] Live NEAR testnet contract and recorded transaction IDs
- [ ] Working browser UI showing *real*, not simulated, contract state
- [ ] At least one completed payout and two rejected claims
- [ ] Current clean CI run
- [ ] Screenshot/video showing testnet-only labels and genuine explorer entries
- [ ] Public X post with required tags and link
- [ ] Submission form; select NFTs That Do Something and only other truly applicable tracks
