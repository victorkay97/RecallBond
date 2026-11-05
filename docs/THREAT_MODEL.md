# RecallBond — Security assumptions and threat model

**Status:** Preliminary threat model, not a security audit.

## Trust boundary
A NEAR NFT represents registered passport ownership, NOT independently verified possession or legal title to a physical item. Manufacturer identity is allowlisted by the platform admin in this MVP. Serial commitment does not verify a physical serial.

## Financial invariants
- A campaign cannot activate unless the full theoretical maximum payout is deposited.
- Once created, the campaign's batch is frozen against new eligible NFT minting.
- Every (campaign, token) combination can be claimed at most once.
- A successful claim reduces unallocated campaign reserve and creates credit for that claimant.
- Transfer after claim does not transfer the claimant's credit.
- A withdrawal removes credit before scheduling a transfer; failed transfers should restore it.
- Unclaimed reserve can return to issuer only after campaign expiry.

## Attacks to test
1. Unregistered issuer attempts minting.
2. Issuer registers same serial commitment twice.
3. Issuer attempts to inflate eligibility by minting after campaign creation.
4. Original owner claims after transfer.
5. Someone else claims with a leaked token ID.
6. Repeated claim for same token/campaign.
7. Unfunded activation.
8. Overflow/underflow in payouts.
9. Non-owner or malicious contract invokes callbacks.
10. A payment promise fails and credit must be restored once.
11. Transfer-call is pending, receiver may reject it, and the claimant must not exploit temporary owner state.
12. Campaign expiration prevents new claims but does not invalidate already approved credit.
13. Storage accounting separates deposits for storage from campaign reserves.

## Critical code review items
- Confirm NEP-171 transfer_call resolver behavior with wrapper's pending-transfers map.
- Confirm callback is private to current contract and rejects spoofed results.
- Check NEAR storage/rent requirements, including deposits and refunds.
- Check that funds available to withdraw cannot fall below reserved liabilities.
- Check delayed promise failures and account deletion scenarios.
- Audit account authorization and field validation before any mainnet deployment.

## Limits
This contract has not been compiled, deployed or audited. Do not send real funds. Physical claims and disputes need explicit offchain verification, legal agreements and real issuer participation.
