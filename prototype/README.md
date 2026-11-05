# RecallBond interactive reference

A **local-only** browser simulator used to demonstrate the intended ownership/claim behavior. It does not connect to NEAR. All money values are simulated.

Run the tests:
```bash
node --test ledger.test.mjs
```

Run the demo with a local HTTP server (the browser ES modules require serving over HTTP):
```bash
python3 -m http.server 4173
```
Then open http://localhost:4173/ .

Do not describe these tests or visuals as proof of deployed NEAR smart contracts.
