# RecallBond — Judge entry point (NEAR Hackathon 2026)

**Primary track:** NFTs That Do Something.

**Pitch:** Transferable NFT product passports make manufacturer-funded recall protection follow the current onchain owner. Former owners cannot claim after transfer, duplicate claims are rejected, and compensation comes from a fully funded testnet reserve.

## Try the working project

- Public website: https://recallbond.vercel.app/
- Mobile consumer demo (clearly labeled simulated interface): https://recallbond.vercel.app/app/
- Manufacturer demo (fictional NovaTech business): https://recallbond.vercel.app/business/
- Public read-only NEAR verification: https://recallbond.vercel.app/verify/?id=RB-NV-002891
- Full smart-contract evidence: [docs/TESTNET_EVIDENCE_2026-11-12.md](docs/TESTNET_EVIDENCE_2026-11-12.md)
- Integrated admin, account-signed blockchain API and new premium judge walkthrough: https://github.com/victorkay97/RecallBond/pull/24 (draft, local browser tests pass; production deployment pending).

## Real testnet receipts — not just UI mockups

1. [Mint NFT product passport](https://explorer.testnet.near.org/transactions/AsGyzqgtgCs23EUBN4yCfdgRdSjoz4AA8p3VQnt5hucN)
2. [Transfer Ada → Tomi](https://explorer.testnet.near.org/transactions/49TB1NbHQLNjfhi1eALV7yCBahef3L9AXZ7XCpWUFcMo)
3. [Fund recall reserve](https://explorer.testnet.near.org/transactions/CpeFEKMSEjG5vvRu4moBDD3c43rY6dEWzakSJSuCTXHJ)
4. [Former owner denied](https://explorer.testnet.near.org/transactions/2TrjKqrjoLcjX2McdB1ntE2bJwZRJARUznxPQnSHuLNL)
5. [Current owner claim accepted](https://explorer.testnet.near.org/transactions/HmYwR5dw1BMrsNpsHWjiXsTAv5AJQwJafMRhcKxku5vX)
6. [Compensation withdrawal finalized](https://explorer.testnet.near.org/transactions/6zLUqcwAvcf1cEhNVPjkUZrhLH66a3xmjFxTGbP23eru)

**Testnet contract:** rb-vk97-261112.testnet

## How to evaluate accurately

Public sample UI flows and independently verified NEAR contract transactions are different evidence types. The smart contract mint-transfer-recall-claim-withdrawal journey has been executed on testnet and has public receipts. The **new** encrypted-key account signup, restricted admin, sponsored-wallet activation and account-signed browser APIs are under final integration testing on a separate branch; they must not be represented as a proven live browser E2E.

No special judge credentials are needed to inspect the public demo and testnet proof. Do not submit a password, seed phrase or sponsor key to this repository.

**Deadline:** 14 November 2026 at 23:59 UTC (15 November, 00:59 WAT). Official requirements: public GitHub repository and public X demo post with a video or screenshots. https://nearhackathon.com/

## Short X demo post (attach a video or screenshots; not yet published)

Built RecallBond at the NEAR HACKATHON.

Transferable NFT product passports. Funded recall payouts follow the current owner—verified on NEAR testnet.

Demo: https://recallbond.vercel.app/
Code: https://github.com/victorkay97/RecallBond

@NEARProtocol #NEARHackathon

Post from your own X account with a real media attachment and submit the public X post URL in the official form.
