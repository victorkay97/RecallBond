# NEAR Sandbox integration tests

This directory executes the **real compiled RecallBond contract**, not a mock. It starts an official NEAR Sandbox local blockchain and performs mint, transfer, reserve funding, claim rejection, successful claim, duplicate rejection, and withdrawal.

- Node.js 22+
- Rust toolchain and WASM target
- `cargo-near` executable
- NEAR Sandbox v2.13.0 (protocol 86) executable, available through `NEAR_SANDBOX_BIN_PATH`

From the repository root:

```bash
cd contract
cargo near build non-reproducible-wasm --no-abi
cd ../integration
npm install
NEAR_SANDBOX_BIN_PATH=/absolute/path/to/near-sandbox npm test
```

The CI workflow [sandbox-check.yml](../.github/workflows/sandbox-check.yml) downloads NEAR Sandbox v2.13.0, builds the contract using cargo-near, runs this test, and uploads the validated WASM artifact **only after the end-to-end test succeeds**.

The older `near-workspaces` JS test package resolves a legacy nearcore binary (protocol 77) by default. This test file replaces only that package's executable loader when `NEAR_SANDBOX_BIN_PATH` is set. You can inspect the test logs to confirm protocol 86; the contract code and assertions are never mocked.

## Safety

Local Sandbox uses fictional NEAR accounts and disposable token balances; successful sandbox transfers are **not** public testnet transfers. A separately wallet-authorized testnet deployment remains a required milestone.
