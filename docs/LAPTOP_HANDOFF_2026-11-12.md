# RecallBond — laptop return handoff (12 November 2026)

## Current deadline
14 November 2026 at **23:59 UTC** (15 November at **00:59 WAT**, Nigeria). Official: https://nearhackathon.com/

## Remote changes
- Branch: `feat/defect-claims-hackathon-2026`.
- Added consumer-initiated defect reporting and fictional manufacturer review under `prototype/claims/`.
- Added unit and browser end-to-end tests. **Do not claim passing CI until current PR checks are green.**
- Review decisions are strictly browser-only. Neither the complaint form nor the existing Consumer/Business dashboard is an authenticated onchain interface.

## What the user must do once at a secure laptop
1. Open the repo PR and inspect green checks / latest source; merge only once validated.
2. Verify the working site and demo flow. Make sure a report submitted in Consumer appears in Business **on the same browser and domain**.
3. Create and fund **testnet-only** NEAR accounts: contract, issuer, Ada and Tomi. Use separate accounts, do not share seed phrases, keys or wallet sign-in details with anyone. Never place private keys in public GitHub Actions, Vercel env logs or chat.
4. Follow [TESTNET_DEPLOYMENT.md](TESTNET_DEPLOYMENT.md) to deploy WASM, call `new`, allowlist issuer, mint, transfer, create/fund campaign, claim and withdraw. Capture contract ID and explorer transaction hashes. If testnet signature setup is blocked, submit a clearly labeled Sandbox working demo rather than making unsupported deployment claims.
5. Connect actual wallet-signed contract interactions to the UI **only if there is enough time to implement and test safely**. The contract's existing Rust+Sandbox evidence is more important than an unsafe rushed browser signer.
6. Record a demo (under 3 minutes). Clearly distinguish the browser-only consumer issue report from real onchain recall funding/claims.
7. Publish a public X demo post tagging **@NEARProtocol** and **#NEARHackathon**, with video/screenshots, then submit the public repo and X post through the official form before the deadline. Verify the final account address for potential prize receipt. The official FAQ says no wallet connection is required to submit.

### Windows PowerShell (safe read-only start)
```powershell
git clone https://github.com/victorkay97/RecallBond.git
cd RecallBond
git switch feat/defect-claims-hackathon-2026
cd prototype
npm install --no-audit --no-fund
npm test
python -m http.server 4173
```
Then visit http://localhost:4173/app/#collection and http://localhost:4173/business/#claims. Use a separate PowerShell terminal for further commands.

### P0 / P1 / P2 decision
- **P0**: preserve passing tests, validate smart contract correctness, testnet proof if secure keys available, reproduce demo, submit.
- **P1**: wallet-signed UI once accounts and contract are ready.
- **P2**: richer warranty cases, real images, analytics, auto-matched defect trends, recipient-accept transfer, embedded wallets, major visual redesign. Do not let P2 delay submission.

### Reminder
A browser localStorage complaint is not a production warranty claim, a registered physical device, a manufacturer-reviewed case, or a financial entitlement.
