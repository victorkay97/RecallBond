# RecallBond UI direction — v0.3

## Goal
A mobile-first consumer wallet and collectible passport experience: Enjin-style dimensional collectibles, Solflare-inspired expanded desktop portfolio organization, and restrained premium product design.

## Implemented in prototype
- `/app/`: responsive app, overview, collectible passport gallery, wallet, activity and bottom tabs on mobile.
- 3D passport card flips with locally generated QR SVG pointing to `/verify/?id=...` (via MIT-licensed qrcode-generator).
- Modal/bottom-sheet interaction previews for transfer, claim, withdrawal, product activation and account.
- `/business/`: manufacturer overview, products, funded recalls, insights, dialogs and mobile bottom tabs.
- `/verify/`: no-login product lookup using minimal fictional records, excludes actual owner identity.
- Distinct demo claim credit and spendable wallet balance. No wallet in these previews is connected to NEAR.
- Reduced-motion preference respected for major animations.
- Reference contract walkthrough preserved in `/demo/` (old index remains the root until redirect goes live).

## Design principles
1. Clear and human-friendly UI; NFT and blockchain should feel like infrastructure, not the product's language.
2. Passports must look collectible and interact naturally without making financial claims feel like a game.
3. Front of passport: manufacturer, model, status, visual identification. Back: scannable verification QR and passport ID.
4. QR lookup never grants ownership. Public page never exposes owner name, email, number, or raw IMEI.
5. Modal on desktop, bottom sheet on phone. Mobile navigation stays within thumb reach.
6. Financial states are precise: eligible → approved contract credit → withdrawal pending → settled in wallet.
7. No success or value is presented as onchain when a user clicked a simulated button.

## QA status
- Static reference behavior and portal tests: 18 cases passed in GitHub Actions.
- Playwright mobile/desktop screenshot workflow installed; initial run reached a test-selector ambiguity after testing flip and navigation. Selector fix pending push.
- Public Vercel preview deployed at https://recallbond-demo.vercel.app/app/

## Next development
- Integrate wallet auth and NEAR testnet transactions.
- Replace fictional verification with signed issuer and NFT state lookup.
- Render data-driven passport cards, not hand-coded examples.
- Improve keyboard and assistive technology accessibility; focus trap in all dialogs.
- Review phone sizing at 320px, 360px, 390px, 430px and tablets.
- Keep end-to-end product flow connected and avoid confusing mock credits with actual balance.

## Design references
- Enjin Wallet: expressive collectibles and NFT handling.
- Solflare expanded interface: spacious wallet-like organization and concise account context.
- This is an independent RecallBond design, not a copy of another product.
