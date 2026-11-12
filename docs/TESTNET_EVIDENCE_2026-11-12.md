# RecallBond — NEAR testnet evidence log (12 November 2026)

This log records transaction IDs reported by the operator from NEAR CLI 0.31.1 output. All transactions are on **testnet**, with fictional people/manufacturer/products. It is an evidence index; it does not by itself substitute for independent explorer/RPC validation.

## Contract and accounts

- Contract/admin: `rb-vk97-261112.testnet`
- Manufacturer: `novatech-vk97-261112.testnet`
- Original product owner: `ada-vk97-261112.testnet`
- Intended recipient: `tomi-vk97-261112.testnet`
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

## Next verifications (not yet reported)

- [ ] Query `get_product` / `nft_token` to confirm owner is Ada before transfer.
- [ ] Transfer token Ada → Tomi with **exactly 1 yoctoNEAR** and capture transaction hash.
- [ ] Query ownership after transfer.
- [ ] Issuer creates campaign for frozen batch, funds **full** maximum liability and activates it.
- [ ] Demonstrate former owner rejection, rightful claimant success, duplicate claim rejection.
- [ ] Demonstrate withdrawal and callback settlement, capture final wallet balance/transaction.
- [ ] Show /verify/ optional read-only testnet lookup using the real contract ID and token ID.
- [ ] Record <3 minute video and publish X/Devpost submission.

Security note: never save secret keys or wallet seed phrases to this repo. The serial commitment is salted; the random source salt remains local to the operator and must not be committed.
