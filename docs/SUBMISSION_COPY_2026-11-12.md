# RecallBond — submission copy and demo story (prepared, not submitted)

**Event:** NEAR HACKATHON 2026
**Track:** NFTs That Do Something
**Repository:** https://github.com/victorkay97/RecallBond
**Submission cutoff:** 14 November 2026, 23:59 UTC (15 November 00:59 WAT).
**State:** Draft pending final verification and public demo.

## Project title
**RecallBond — Product protection that follows ownership**

## One-line pitch
A NEAR-powered digital product passport that makes manufacturer-funded recall entitlements transferable to the current registered owner.

## Submission description (paste into the form)
Products often change hands, but their protection does not. RecallBond gives each manufacturer-issued device a NEP-171 digital passport tied to a clear, funded recall entitlement. When ownership transfers, any unclaimed eligibility moves to the new holder. A manufacturer locks the full batch payout liability before activating a campaign; only the current passport owner can claim, and an approved credit remains with that claimant even after a later transfer. The contract prevents former-owner claims, duplicate claims and underfunded campaigns. We also preview how consumers could report defects directly against passports for manufacturer review. That warranty-support workflow is an **offchain browser demo**, not a real manufacturer integration or payment.

## Short X post (publish ONLY after evidence is ready)
We built **RecallBond** for the NEAR HACKATHON.

A product changes hands. Its protection should be able to follow.

We use NEAR NFT passports to link manufacturer-funded recall benefits to the current registered owner. Transfer the passport, transfer *unclaimed* eligibility. Claim once, and the approved credit stays with the claimant.

We also prototyped consumer defect reporting — a phone screen develops a line, the owner reports it, and a fictional manufacturer reviews the case. That support flow is a browser demo; the funded recall mechanism is what runs on NEAR.

Demo: [ADD PUBLIC VIDEO/SCREENSHOTS]
Repo: https://github.com/victorkay97/RecallBond
Testnet proof: [ADD CONTRACT + EXPLORER LINKS ONLY AFTER VERIFIED]

@NEARProtocol #NEARHackathon

## Two-minute demo storyboard
| Time (target) | Evidence and narration |
| --- | --- |
| 0:00–0:14 | Show public product passport card and simple value proposition. Explain fictional NovaTech example. |
| 0:14–0:32 | Consumer My Products → Report an issue → screen display problem. Open Business Claims; fictional reviewer updates status. Label LOCAL DEMO. |
| 0:32–0:46 | Introduce NEAR NEP-171 passport and transfer Ada → Tomi. Show real transaction evidence if deployed; otherwise clearly label Sandbox evidence. |
| 0:46–1:10 | Manufacturer creates and fully funds a frozen-batch recall. Show reserve accounting and contract calls. |
| 1:10–1:30 | Former owner Ada fails; current owner Tomi claims; duplicate attempt fails. Show receipts or reproducible Sandbox execution. |
| 1:30–1:47 | Tomi withdraws approved credit; differentiate contract credit from final wallet settlement. |
| 1:47–2:00 | Optional public NEAR read-only lookup and repository tests; invitation to inspect the source. |

## Submission verification
- [ ] GitHub source is public and final CI is passing.
- [ ] Video/screenshots were captured from the **actual product**.
- [ ] Public X post includes the project, official tag and hashtag, and video/screenshots.
- [ ] All testnet screenshots show real contract IDs, explorer transactions and confirmed state, or are explicitly marked Sandbox.
- [ ] User supplies a valid intended NEAR account address for prize receipt.
- [ ] Official submission form completed, with both repo and X demo URLs.

**Do not publish this text unchanged if public testnet proof is absent.** Replace the testnet paragraph with a factual statement about the reproducible NEAR Sandbox contract execution. Never pretend mocked browser actions are confirmed blockchain payments.
