# RecallBond — submission copy and demo story (prepared, not submitted)

**Event:** NEAR HACKATHON 2026
**Track:** NFTs That Do Something
**Repository:** https://github.com/victorkay97/RecallBond
**Submission cutoff:** 14 November 2026, 23:59 UTC (15 November 00:59 WAT).
**State:** Core NEAR testnet deployment, ownership transfer, fully funded recall, claim and withdrawal **verified 12 November 2026**. Public video, X post and official form still pending.

## Project title
**RecallBond — Product protection that follows ownership**

## One-line pitch
A NEAR-powered digital product passport that makes manufacturer-funded recall entitlements transferable to the current registered owner.

## Submission description (paste into the form)
Products often change hands, but their protection does not. RecallBond gives each manufacturer-issued device a NEP-171 digital passport tied to a clear, funded recall entitlement. When ownership transfers, any unclaimed eligibility moves to the new holder. A manufacturer locks the full batch payout liability before activating a campaign; only the current passport owner can claim, and an approved credit remains with that claimant even after a later transfer. The contract prevents former-owner claims, duplicate claims and underfunded campaigns. We also preview how consumers could report defects directly against passports for manufacturer review. That warranty-support workflow is an **offchain browser demo**, not a real manufacturer integration or payment.

**Real NEAR testnet demonstration:** Contract `rb-vk97-261112.testnet`. Fictional manufacturer NovaTech minted passport `RB-NV-002891` to Ada, who transferred it to Tomi. NovaTech funded campaign #0 with 0.1 testnet NEAR and activated it. Ada's attempted claim failed; Tomi claimed the 0.1 testnet NEAR entitlement, a duplicate claim failed, and Tomi withdrew it successfully. The callback returned `true`; finalized RPC confirms his remaining contract credit is 0, claim count 1 and final wallet balance 10.0972357391947914 test NEAR. This is testnet-only; no real manufacturer or warranty terms are represented.

## Verified public testnet evidence

- [Contract deployment and initialization](https://explorer.testnet.near.org/transactions/8ueoDCeK9boo3UpzBhd9FUdPmsHtN6PnSgGPoKLLL4xf)
- [NFT mint to Ada](https://explorer.testnet.near.org/transactions/AsGyzqgtgCs23EUBN4yCfdgRdSjoz4AA8p3VQnt5hucN)
- [Ada transfers passport to Tomi](https://explorer.testnet.near.org/transactions/49TB1NbHQLNjfhi1eALV7yCBahef3L9AXZ7XCpWUFcMo)
- [Manufacturer fully funds campaign #0](https://explorer.testnet.near.org/transactions/CpeFEKMSEjG5vvRu4moBDD3c43rY6dEWzakSJSuCTXHJ)
- [Manufacturer activates campaign](https://explorer.testnet.near.org/transactions/4iJ9cYgyT6ieSzndWRvFdtoBjqwXwtkCfVEaN7ibgXqb)
- [Former owner Ada's claim fails](https://explorer.testnet.near.org/transactions/2TrjKqrjoLcjX2McdB1ntE2bJwZRJARUznxPQnSHuLNL)
- [Current owner Tomi claims 0.1 test NEAR](https://explorer.testnet.near.org/transactions/HmYwR5dw1BMrsNpsHWjiXsTAv5AJQwJafMRhcKxku5vX)
- [Duplicate attempt fails](https://explorer.testnet.near.org/transactions/Fhq97He6cNaXFDQL8v1jLMsTZqWRwz9PjcLv8EiQzGsB)
- [Withdraw and successful callback](https://explorer.testnet.near.org/transactions/6zLUqcwAvcf1cEhNVPjkUZrhLH66a3xmjFxTGbP23eru)
- [Evidence table and final RPC checks](https://github.com/victorkay97/RecallBond/blob/main/docs/TESTNET_EVIDENCE_2026-11-12.md)

Note: The CLI returned a generic WASM trap for failed calls, not the human-readable guard name. The contract source, rejected transactions and unchanged ledger state jointly support the rejection behavior.

## X post draft (publish with real screen recording)

Built RecallBond for @NEARProtocol #NEARHackathon.

A device changes hands. Its unclaimed recall protection should follow its new owner.

We proved the full journey on NEAR testnet: NFT passport minted → Ada transfers it to Tomi → manufacturer locks the entire 0.1 NEAR recall reserve → Ada's claim fails → Tomi claims and withdraws successfully. Duplicate claim blocked.

The consumer issue-reporting flow is a labeled browser demo. The recall transactions are real testnet execution.

Demo: https://recallbond-demo.vercel.app/verify/
Code: https://github.com/victorkay97/RecallBond
Proof: https://explorer.testnet.near.org/transactions/6zLUqcwAvcf1cEhNVPjkUZrhLH66a3xmjFxTGbP23eru

[ATTACH REAL VIDEO/SCREENSHOTS BEFORE POSTING]

## Two-minute demo storyboard
| Time (target) | Evidence and narration |
| --- | --- |
| 0:00–0:14 | Show public product passport card and simple value proposition. Explain fictional NovaTech example. |
| 0:14–0:32 | Consumer My Products → Report an issue → screen display problem. Open Business Claims; fictional reviewer updates status. Label LOCAL DEMO. |
| 0:32–0:46 | Introduce NEAR NEP-171 passport and transfer Ada → Tomi. Show the verified NEAR testnet mint and transfer transactions. |
| 0:46–1:10 | Manufacturer creates and fully funds a frozen-batch recall. Show campaign #0 funding and activation receipts, 0.1 test NEAR reserve. |
| 1:10–1:30 | Former owner Ada fails; current owner Tomi claims; duplicate attempt fails. Show Ada's failed tx, Tomi's accepted tx and duplicate failure; label generic trap errors accurately. |
| 1:30–1:47 | Show successful withdrawal tx/callback `true`, finalized zero credit and wallet balance. |
| 1:47–2:00 | Public NEAR read-only lookup with prefilled contract/token, repository tests, invitation to inspect source. |

## Submission verification
- [ ] GitHub source is public and final CI is passing.
- [ ] Video/screenshots were captured from the **actual product**.
- [ ] Public X post includes the project, official tag and hashtag, and video/screenshots.
- [x] Testnet source evidence and transaction hashes recorded; screenshots must still show real IDs, receipts and confirmed state.
- [ ] User supplies a valid intended NEAR account address for prize receipt.
- [ ] Official submission form completed, with both repo and X demo URLs.

**Testnet proof now exists**, but do not publish as if the browser issue-reporting portal is an authenticated manufacturer service, and do not post before attaching a real video/screenshots. Official form submission and X post still require explicit action.
