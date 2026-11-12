# RecallBond — consumer-initiated defect reporting (hackathon MVP)

## Why this matters
RecallBond supports two distinct journeys:

1. **Manufacturer-led recall** — an authorized manufacturer freezes a defective product batch, funds the full eligible liability on NEAR, and the current digital passport holder claims their entitlement.
2. **Consumer-led report** — a registered owner reports a malfunction on a product passport. The manufacturer reviews evidence and warranty terms, and may approve repair, replacement, ask for more detail, or decline.

Together they form an auditable product-protection lifecycle. **Neither a consumer complaint nor the mere existence of a passport guarantees coverage, reimbursement or replacement.** Actual manufacturer participation is required.

## Hackathon scope: isolated browser simulation
- **Consumer app** /app/#collection: select a demo passport, choose **Report an issue**, select a defect category, describe the issue and optionally note when it appeared.
- **Photo picker**: visual local selection only. The image is **never uploaded or stored** in the current demo. Reviewers cannot inspect it. Do not claim evidence review exists.
- **Manufacturer studio** /business/#claims: reports from the same browser and origin appear in a local review queue.
- **Review options**: submitted → under review / more information requested / repair approved / replacement approved / declined, with guarded transitions and a required reason for more-info and declined outcomes.
- **Consumer tracking**: the original browser shows the updated case state. Other browsers, devices, private windows and origins do **not** synchronize data.
- **Data persistence**: localStorage only; capped at 50 cases; Clear browser demo cases button removes records. All users should avoid putting real identifying information in the preview.
- **No financial changes**: a simulated warranty approval never writes to the NEAR contract, grants tokens, mints passports or creates withdrawable funds.

### Demonstration script
1. Navigate to /app/#collection and select NovaPhone S2.
2. Open Report an issue; category **Display or screen**, description **A green vertical line appeared on the display during normal use.**
3. Submit. Confirm **Submitted** in Reported issues.
4. Open /business/#claims **in the same browser and origin**. Review the case; mark **Under review** with a note.
5. Review it again; mark **Replacement approved · demo**. Confirm it is now final.
6. Return to /app/#collection, reload, and confirm the fictional decision appears.
7. Contrast this offline local workflow with /demo/: the separately tested onchain manufacturer-funded compensation flow.

## Claims object (offchain)
`id`, `passportId`, `category`, `description`, optional `observedAt`, `status`, `createdAt`, `updatedAt`, and review `history`. Stored only in this browser.

## Production requirements — AFTER hackathon
- Authenticated consumer, verified registered ownership at submission, authorized organization reviewers and role-based access.
- Encrypted backend database, access logging, rate limits, deduplication, abuse reporting and privacy/retention policy.
- Secure evidence upload with redaction, malware scanning, limits, consent, deletion and signed short-lived URLs.
- Real policy and warranty eligibility evaluation, independent inspection and dispute/appeal process.
- Repair logistics and replacement inventory; statuses backed by actual fulfillment rather than simulated UI.
- Voluntary manufacturer authorization to launch campaigns based on aggregate defects; no automatic campaign or payout based only on crowd reports.
- New **contract-enforced** conditional claim flow with authenticated decision attestations if financial remedies are ever linked to warranty complaints. Never gate money solely in frontend JavaScript.
- Fraud controls: QR or IMEI alone never establishes physical ownership; protect raw identifiers; prevent duplicate and false claims.

## Hackathon safety boundary
The tested onchain mechanism is NEP-171 passport ownership with fully-funded, current-owner, one-time **recall** claims. The newly added defect workflow is not an extension of that mechanism and must always be labeled as a browser-only preview. All manufacturers, products and benefits in the demo are fictional.

## Separate read-only NEAR verifier
The `/verify/` page now also contains an optional public `get_product` call to an explicitly supplied NEAR testnet contract account. This is independent of both browser-only warranty reports and wallet-signed recall transactions. It does not surface the owner account or serial commitment, and it does not attest that a real manufacturer backs the arbitrary account.
