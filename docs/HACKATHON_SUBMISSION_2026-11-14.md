# RecallBond — NEAR Hackathon submission kit
Updated 14 November 2026. Public repo: https://github.com/victorkay97/RecallBond

## Deadline
**14 Nov 2026, 23:59 UTC = 15 Nov 2026, 00:59 WAT (Nigeria)**. Submit BEFORE 00:59 WAT. Source: https://nearhackathon.com/

The official submission requires a public GitHub repository and public X demo post with a video or screenshots. The submission form may also request a payout NEAR address; provide an address you personally control, not the deployed smart contract or sponsor.

Do not depend on Vercel's free deployment quota resetting at midnight. The existing public app remains usable.

## Working public links
- Repository: https://github.com/victorkay97/RecallBond
- Website: https://recallbond.vercel.app/
- Consumer sample: https://recallbond.vercel.app/app/
- Manufacturer sample: https://recallbond.vercel.app/business/
- Live onchain verifier: https://recallbond.vercel.app/verify/?id=RB-NV-002891
- Contract account: rb-vk97-261112.testnet
- Integration PR: https://github.com/victorkay97/RecallBond/pull/24
- New judge walkthrough: https://recallbond.vercel.app/judge/ (ONLY after deployment; currently in the feature branch)
- X demo post: NOT YET POSTED. Paste the real post URL only after publishing.

## Ready-to-post X copy (fits a standard X post)
Built RecallBond at the NEAR HACKATHON.

Transferable NFT product passports. Funded recall payouts follow the current owner—verified on NEAR testnet.

Demo: https://recallbond.vercel.app/
Code: https://github.com/victorkay97/RecallBond

@NEARProtocol #NEARHackathon

Attach actual screenshots or a 45–90-second recording, ideally showing the consumer passport, manufacturer workspace, real blockchain verification and NEAR transaction receipts. Do not mislabel sample UI interactions as live contract transactions.

## Video plan (75 seconds)
1. 0–10s: landing: why protection must follow the product.
2. 10–25s: consumer sample, collection, passport and flip QR.
3. 25–40s: manufacturer sample, product and recall concepts.
4. 40–56s: public verifier with actual contract record RB-NV-002891.
5. 56–70s: NEAR explorer receipts for ownership transfer, old-owner denial, current-owner claim and payout.
6. 70–75s: RecallBond wordmark and NEAR Hackathon.

## Verified receipts
- Mint: https://explorer.testnet.near.org/transactions/AsGyzqgtgCs23EUBN4yCfdgRdSjoz4AA8p3VQnt5hucN
- Transfer: https://explorer.testnet.near.org/transactions/49TB1NbHQLNjfhi1eALV7yCBahef3L9AXZ7XCpWUFcMo
- Reserve funded: https://explorer.testnet.near.org/transactions/CpeFEKMSEjG5vvRu4moBDD3c43rY6dEWzakSJSuCTXHJ
- Old-owner denied: https://explorer.testnet.near.org/transactions/2TrjKqrjoLcjX2McdB1ntE2bJwZRJARUznxPQnSHuLNL
- Current owner claimed: https://explorer.testnet.near.org/transactions/HmYwR5dw1BMrsNpsHWjiXsTAv5AJQwJafMRhcKxku5vX
- Compensation withdrawn: https://explorer.testnet.near.org/transactions/6zLUqcwAvcf1cEhNVPjkUZrhLH66a3xmjFxTGbP23eru

## Accurate scope statements
- Public website, consumer sample, manufacturer sample, and verifier returned HTTP 200 on 14 Nov 2026.
- The public verifier independently returned issuer, batch and token ID on NEAR testnet.
- The signed blockchain mint/transfer/recall/payout lifecycle has been executed through NEAR CLI and is supported by transaction receipts.
- The public consumer/manufacturer sample experiences are browser demos, separate from the signed contract evidence.
- The new encrypted-wallet signup, admin dashboard and sponsored account API code pass local automated tests but still require new-account browser-funded E2E.
- Production still serves the old deployment. Vercel Preview is behind Vercel Authentication. Never submit a protected Preview as the only product demo.
- Do not publish private keys, user passwords, sponsor credentials or vault keys. Do not invent demo receipts.

Submit early; allow time for the form and X attachment upload rather than waiting until 00:59 WAT.
