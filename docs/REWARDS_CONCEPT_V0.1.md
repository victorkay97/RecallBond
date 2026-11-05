# RecallBond Rewards — Product Exploration v0.1 (NOT IMPLEMENTED)

## Problem and idea

Product passports have verifiable registered ownership, but manufacturers might also want to grant real benefits to owners, sometimes as an optional hidden surprise at activation. This is not a resale marketplace and **a claimed numeric NFT "worth" is not money**.

**Proposed feature:** An issuer can attach a separately funded benefit (for example a redeemable entitlement to 10 NEAR, or an extended repair credit) to a product passport. The entitlement may remain hidden visually until legitimate first activation, then its owner can see what the manufacturer actually promised.

## Two reward forms

### 1. Passport-attached financial entitlement (preferred first)
- Issuer defines `passport_id`, `reward_program_id`, exact asset/amount, claim rules, eligible activation window, expiry, and transfer policy.
- Issuer irrevocably funds the amount in a dedicated reserve before marking it claimable. Display **"10 NEAR funded benefit"**, never **"NFT market value = 10 NEAR"**.
- Prior to redemption, the entitlement follows NFT ownership (or remains bound to the first activated owner according to terms).
- Redeemed benefit is credited to a specific beneficiary. Transfer of passport afterward cannot replay the claim.
- Reserve accounting keeps reward funds separate from recall/compensation reserves.
- Currency: native NEAR testnet tokens for any demonstration; commercial fiat rewards need licensed payment settlement.

### 2. Bonus collectible NFT
- On verified activation, manufacturer can issue a separate collectible NFT, which might represent a service benefit or a badge.
- The collectible's artistic scarcity is not a guarantee of cash value or resale price.
- If it carries an actual redeemable benefit, that benefit requires explicit funding and terms independent of artwork.
- Passport ownership and the bonus collectible ownership can diverge after resale; define which benefits stay with the product.

## Hidden reward reveal

1. Before sale, issuer commits to a reward allocation or signed eligibility root; do not expose individual reward amounts in public passport metadata.
2. An authorized retailer or device attestation confirms a legitimate sale or activation. A public QR alone never unlocks a reward.
3. After consumer identity is bound to the passport, a reveal proves the corresponding allocation without changing terms.
4. Show a polished reveal animation and exact reward terms. Provide a receipt and claim status.
5. Claim to the authenticated NEAR account only once; withdrawal/callback succeeds or restores credit safely.
6. On resale, define whether an **unrevealed, unclaimed** entitlement travels with the passport. Clearly disclose this so users cannot unknowingly sell a funded benefit.

## Important confidentiality limitation

Plain unsalted hashes of small numbers (e.g., '10 NEAR') can be brute-forced. Onchain transactions, deposits and transfer histories may expose total reward budget and some patterns. A commitment alone does not guarantee privacy.

If the mechanism needs truly hidden amounts, assess cryptographic commitments with high-entropy salts, batch-level funding, delayed reveal and whether the public funding model can actually conceal the amount. Do not claim secrecy merely because the website hides a field.

## Supply-chain fairness

Retailers should not be able to scan packaging before sale to claim/identify valuable units. For randomized assignment, an issuer-specified allocation can be manipulated; use a transparent distribution policy or verifiable randomness/commit–reveal after the point of legitimate sale. Keep proof of activation separate from simple QR possession.

## Security invariants

- All funded value is accounted for, cannot be double-claimed, and cannot be taken from recall reserves.
- Manufacturer cannot silently revise allocation after the committed deadline.
- Public passport verification must never reveal consumer identity or secret activation credentials.
- A successful claim's beneficiary remains fixed if the product passport later moves.
- Expired/unclaimed reserves follow program terms and refund constraints.
- Multiple manufacturer campaigns must not overcommit the same contract balance.
- If the value is native NEAR, token price fluctuation is not the same as a fixed fiat benefit.

## Legal and commercial concerns

Randomly allocated cryptocurrency prizes tied to consumer purchases can raise advertising, promotional lottery, consumer protection, tax, AML and jurisdiction-specific questions. Review before launching; do not add pay-to-enter or wagering mechanics. Never suggest an NFT is guaranteed to appreciate or its artwork alone has a fixed redeemable value.

## MVP decision

**Do not add to the Nov 14 hackathon smart contract now.** RecallBond already proves a manufacturer-funded entitlement for product recall. Rewards are a distinct later phase and should be implemented in a separate contract module with its own threat model and tests.

The design can preview a locked "Manufacturer benefit" card **without claiming any NEAR has been won, credited or funded**.

## One-line public description

"Some manufacturer-issued RecallBond passports may carry additional, separately funded benefits. Their value comes from the verified benefit terms—not a speculative NFT price."
