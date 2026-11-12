# RecallBond — NEAR testnet evidence log (12 November 2026)

This log records transaction IDs reported by the operator from NEAR CLI 0.31.1 output. All transactions are on **testnet**, with fictional people/manufacturer/products. It is an evidence index; it does not by itself substitute for independent explorer/RPC validation.

## Contract and accounts

- Contract/admin: `rb-vk97-261112.testnet`
- Manufacturer: `novatech-vk97-261112.testnet`
- Original product owner: `ada-vk97-261112.testnet`
- Current owner (confirmed by direct RPC): `tomi-vk97-261112.testnet`
- Passport token ID: `RB-NV-002891`
- Example product: NovaBook Air
- Batch ID: `BATTERY-X21`
- Contract build artifact: [GitHub Actions success](https://github.com/victorkay97/RecallBond/actions/runs/43186108944) (merge commit `b357487cc083a7648e748dc5fe95f59e70f35276`)
- The operator verified the downloaded WASM's SHA-256 against the CI artifact before deployment.

## Operator-confirmed transactions

| Action | Testnet transaction | Outcome as reported |
|---|---|---|
| Contract/admin account creation | [BasHtTcE7fPDza4Ek3pQdayZcMpmQ2GT4q5P18CfLRFD](https://explorer.testnet.near.org/transactions/BasHtTcE7fPDza4Ek3pQdayZcMpmQ2GT4q5P18CfLRFD) | Account created, 10 test NEAR initially |
| Deploy WASM and initialize `new(admin)` | [8ueoDCeK9boo3UpzBhd9FUdPmsHtN6PnSgGPoKLLL4xf](https://explorer.testnet.near.org/transactions/8ueoDCeK9boo3UpzBhd9FUdPmsHtN6PnSgGPoKLLL4xf) | Contract deployed and initialized |
| Manufacturer account creation | [Cc4noL9Dfp4g4gVqLyGZNhFxeygRdo4xejh9xBPfTdm3](https://explorer.testnet.near.org/transactions/Cc4noL9Dfp4g4gVqLyGZNhFxeygRdo4xejh9xBPfTdm3) | Account created |
| Admin registers NovaTech issuer | [AuvAYr3KEaP94z5umAiGwVxXARTmge78VCXU4CNkCfAV](https://explorer.testnet.near.org/transactions/AuvAYr3KEaP94z5umAiGwVxXARTmge78VCXU4CNkCfAV) | `register_manufacturer` success |
| Ada account creation | [95dLWik2UxckoHfyjYXn7YC81u51TDGa8urTf12pUHPZ](https://explorer.testnet.near.org/transactions/95dLWik2UxckoHfyjYXn7YC81u51TDGa8urTf12pUHPZ) | Account created, 10 test NEAR initially |
| Tomi account creation | [FFN32By4nYGzb9JR5Gjw8bCpVyrAaEhC1W3LbynPNZfn](https://explorer.testnet.near.org/transactions/FFN32By4nYGzb9JR5Gjw8bCpVyrAaEhC1W3LbynPNZfn) | Account created, 10 test NEAR initially |
| NovaTech mints NEP-171 passport to Ada | [AsGyzqgtgCs23EUBN4yCfdgRdSjoz4AA8p3VQnt5hucN](https://explorer.testnet.near.org/transactions/AsGyzqgtgCs23EUBN4yCfdgRdSjoz4AA8p3VQnt5hucN) | `mint_product` success, `nft_mint` event lists Ada as owner |
| Ada transfers passport to Tomi | [49TB1NbHQLNjfhi1eALV7yCBahef3L9AXZ7XCpWUFcMo](https://explorer.testnet.near.org/transactions/49TB1NbHQLNjfhi1eALV7yCBahef3L9AXZ7XCpWUFcMo) | `nft_transfer` success, `nft_transfer` event identifies Ada → Tomi, 1 yoctoNEAR |
| NovaTech creates recall campaign #0 for BATTERY-X21 | [naGYNEk65ZvUL4WJbo5Nagnq7aVKAtsYhsi66o4eXbu](https://explorer.testnet.near.org/transactions/naGYNEk65ZvUL4WJbo5Nagnq7aVKAtsYhsi66o4eXbu) | `create_campaign` success, returned ID 0, payout 0.1 test NEAR, expiry 2026-12-01 |
| NovaTech fully funds campaign #0 | [CpeFEKMSEjG5vvRu4moBDD3c43rY6dEWzakSJSuCTXHJ](https://explorer.testnet.near.org/transactions/CpeFEKMSEjG5vvRu4moBDD3c43rY6dEWzakSJSuCTXHJ) | `fund_campaign` success, exactly 0.1 test NEAR attached; independent finality RPC confirms `funded_yocto=100000000000000000000000`, `activated=false`, `claimed_count=0` |
| NovaTech activates funded recall campaign #0 | [4iJ9cYgyT6ieSzndWRvFdtoBjqwXwtkCfVEaN7ibgXqb](https://explorer.testnet.near.org/transactions/4iJ9cYgyT6ieSzndWRvFdtoBjqwXwtkCfVEaN7ibgXqb) | `activate_campaign` succeeded. Independent finality RPC confirms `activated=true`, `closed=false`, reserve still 0.1 test NEAR, `claimed_count=0` |
| Former owner Ada attempts claim for campaign #0 | [2TrjKqrjoLcjX2McdB1ntE2bJwZRJARUznxPQnSHuLNL](https://explorer.testnet.near.org/transactions/2TrjKqrjoLcjX2McdB1ntE2bJwZRJARUznxPQnSHuLNL) | Transaction **failed** (exit code 1, gas fee ~0.00023 test NEAR), but CLI returned only generic `WebAssembly trap: An unreachable opcode was executed.` The output does **not** specifically identify the `Only current owner can claim` guard. Follow-up claimant/credit/campaign reads still needed. |

## Independent read-only checks

- [x] `get_product` at block **277349753** reported Ada as owner, NovaTech as manufacturer, batch `BATTERY-X21`, token `RB-NV-002891`.
- [x] `get_product` at block **277349978** reported Tomi as owner, NovaTech as manufacturer, same batch/token.
- Direct RPC endpoint working on the operator's laptop: `https://test.rpc.fastnear.com`. Some other endpoints were unreachable due to DNS.

## Next verifications (not yet reported)

- [x] Issuer created campaign #0 and froze the BATTERY-X21 batch.
- [x] Issuer funded **full** 0.1 test NEAR liability. Direct finalized-RPC check confirmed reserve equals maximum liability.
- [x] Issuer activated campaign #0, with finality RPC confirming active, fully funded and zero processed claims.
- [x] Ada's former-owner attempt failed onchain; generic WASM trap in CLI does not establish the precise guard. Follow-up state validation pending.
- [ ] Demonstrate rightful claimant success and duplicate claim rejection.
- [ ] Demonstrate withdrawal and callback settlement, capture final wallet balance/transaction.
- [ ] Show /verify/ optional read-only testnet lookup using the real contract ID and token ID.
- [ ] Record <3 minute video and publish X/Devpost submission.

Security note: never save secret keys or wallet seed phrases to this repo. The serial commitment is salted; the random source salt remains local to the operator and must not be committed.
