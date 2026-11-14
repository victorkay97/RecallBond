# RecallBond design direction — premium interface, retained identity
Updated 14 November 2026

## Design objective
Adopt the practical principles of Apple's Human Interface Guidelines — clarity, hierarchy, familiarity, accessibility, user agency and craft — **without copying Apple's UI, SF Symbols, proprietary assets, navigation patterns or fonts**. This is a cross-platform NEAR web product.

## Brand that does not change
- Product name: RecallBond
- Core idea: Ownership changes. Protection follows.
- Existing typography: Geist for expressive headlines and Inter for functional UI. Do not replace these fonts.
- Existing icon system: authentic MingCute SVG icon sprite.
- Dark-first color: #080b0f base, #11161a panel, #161d21 elevated panel, #edf6f0 principal text, #9caaa2 secondary text, #b8f2c9 restrained mint emphasis, #2a3730 strokes.
- Brand semantics: mint denotes positive or primary action; never use mint to imply that an onchain transaction was confirmed before it was actually checked.

## Practical interaction rules
1. **Progressive disclosure:** show the most useful action and current state first. Hide advanced blockchain mechanics behind clear explanations or links.
2. **One primary action per context:** avoid competing bright buttons. Secondary actions use a quiet outlined treatment.
3. **Proof vs demo:** clearly label any browser-simulated examples. Do not fabricate live wallet state, contract balances or manufacturer data.
4. **Readable status and errors:** distinguish reserved wallet, approved sponsorship, transfer submitted, onchain-active wallet, funded recall, eligible claim, already-claimed and network failure.
5. **Controls that feel responsive:** soft surface transitions, hover feedback only on pointer devices, constrained movement 1–2px, disabled controls visually and semantically disabled.
6. **Consistent shape:** 10px for fields, 16px for buttons/small cards, 20–24px for major panels. Use grid spacing 4/8/12/16/24/32/48/64.
7. **Accessibility:** keyboard-visible focus, semantic headings, true button/label relationships, adequate contrast, accessible forms, mobile overflow checks and reduced-motion support.
8. **Sensitive actions:** explicit confirmation and clear outcome for transferring an NFT, minting, approving funding, suspending accounts or spending test NEAR.
9. **Responsive intent:** 1440 desktop / 390 mobile verified in local Playwright UI tests; navigation must remain usable and any complex tables must scroll or stack gracefully.
10. **Administrative access:** the admin route is not a secret substitute for permissions. A signed session plus explicit database membership is mandatory; the UI remains gated on unverified sessions.

## Implementation
- Shared quality tokens, focus states and subtle panel finishes: prototype/premium.css
- Dedicated judge guide styles: prototype/judge/judge.css
- Original design system and brand tokens: prototype/refined.css and prototype/identity.css
- The judge guide: prototype/judge/index.html
- UI smoke: prototype/preview.e2e.mjs (1440px and 390px) and prototype/judge.test.mjs

## Post-hackathon, not a current claim
This refinement is not an Apple app, does not run SwiftUI, and does not use Apple's actual native components. Later investment could include a full component inventory, design tokens in Figma, a formal WCAG audit, and a comprehensively tested account recovery process.

Guidance reference: https://developer.apple.com/design/human-interface-guidelines/design-principles/
