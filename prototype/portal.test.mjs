import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('all three product surfaces expose responsive entry points',()=>{
 for(const name of ['business','app','verify']) {
  assert.ok(existsSync(new URL(name+'/index.html',import.meta.url)),name+' missing');
  assert.match(read(name+'/index.html'),/<meta name="viewport"/,name+' must be mobile responsive');
 }
});
test('consumer app implements phone-like bottom navigation and card flip',()=>{
 const app=read('app/index.html'),code=read('app/app.js'),styles=read('portal.css');
 for(const view of ['home','collection','wallet','activity']){
  assert.ok(app.includes('id="screen-'+view+'"'),view+' screen missing');
  assert.ok(app.includes('data-go="'+view+'"'),view+' navigation missing');
 }
 assert.match(app,/floating-tabbar/);
 assert.match(app,/passport-inner/);
 assert.match(code,/is-flipped/);
 assert.match(styles,/transform:rotateY\(180deg\)/);
 assert.match(styles,/prefers-reduced-motion/);
});
test('product passport QR is locally generated, scannable and opens our Verify route',()=>{
 const app=read('app/index.html'),code=read('app/app.js');
 assert.match(app,/vendor\/qrcode\.js/);
 assert.match(code,/window\.qrcode/);
 assert.match(code,/qr\.createSvgTag/);
 assert.match(code,/qrURL = id => new URL\('\.\.\/verify\/\?id='/);
 assert.ok(existsSync(new URL('vendor/qrcode.js',import.meta.url)));
});
test('public verification is login-free and does not reveal personal identity',()=>{
 const verify=read('verify/index.html');
 assert.match(verify,/without a login/i);
 assert.match(verify,/Registered · Hidden/);
 assert.match(verify,/IMEI/);
 assert.match(verify,/RB-NV-002891/);
 assert.match(verify,/RB-NV-002892/);
 assert.doesNotMatch(verify,/tomi\.testnet|ada\.testnet|\d{11}@gmail\.com/);
});
test('contract-held compensation and spendable wallet are distinguished',()=>{
 const app=read('app/index.html'),script=read('app/app.js');
 assert.match(app,/AVAILABLE IN NEAR WALLET/);
 assert.match(app,/COMPENSATION CREDIT IN RECALLBOND CONTRACT/);
 assert.match(script,/No wallet was created/);
 assert.match(script,/No NFT was transferred/);
});
test('business studio includes mobile navigation and transparent demo labels',()=>{
 const business=read('business/index.html');
 assert.match(business,/floating-tabbar/);
 assert.match(business,/NEAR testnet/);
  assert.match(business,/id="live-passport-count"/);
  assert.match(business,/id="live-claim-count"/);
  assert.match(business,/business-v2/);
 assert.match(business,/No manufacturer was authenticated/);
 assert.match(business,/No deposit occurred|No blockchain transaction or product registration occurred|No NFT will be minted/);
});

test('consumer report and manufacturer inbox connect via isolated browser-only claims module',()=>{
 const app=read('app/index.html'),business=read('business/index.html');
 const ui=read('claims/ui.mjs'),model=read('claims/model.mjs');
 assert.match(app,/id="open-defect-report"/);
 assert.match(app,/id="consumer-claims"/);
 assert.match(business,/id="b-claims"/);
 assert.match(business,/id="business-claims"/);
 assert.match(business,/data-go="claims"/);
 assert.match(app,/claims\/ui\.mjs/);
 assert.match(business,/claims\/ui\.mjs/);
 assert.match(ui,/submitCase\(/);
 assert.match(ui,/transitionCase\(/);
 assert.match(model,/localStorage|storage/);
 assert.doesNotMatch(model,/fund_campaign\(|claim_compensation\(|withdraw_compensation\(/);
});

test('v2 public landing routes to both audiences and shows real chain proof without auto-redirect',()=>{
 const home=read('index.html');
 assert.match(home,/href="\.\/business\/"/);
 assert.match(home,/href="\.\/app\/"/);
 assert.match(home,/NEAR testnet/i);
 assert.match(home,/viewCall/);
 assert.doesNotMatch(home,/http-equiv="refresh"/);
});
test('business live stats are read-only and do not fabricate demo totals',()=>{
 const business=read('business/index.html'),script=read('business/live.mjs');
 assert.match(business,/live-all-products/);
 assert.match(script,/nft_tokens/);
 assert.match(script,/get_campaign/);
 assert.doesNotMatch(script,/signAndSendTransaction/);
 assert.match(script,/BigInt/);
});

test('refined interface uses SVG icons and concise functional hierarchy',()=>{
 const root=read('index.html'),business=read('business/index.html'),consumer=read('app/index.html');
 const styles=read('refined.css'),iconUpgrade=read('ui-enhance.mjs');
 assert.match(root,/rg-ledger-panel/);
 assert.match(root,/rg-three-features/);
 assert.match(business,/rg-summary-hero/);
 assert.match(business,/rg-actions-grid/);
 assert.match(consumer,/consumer-v2 rb3/);
 assert.match(styles,/font-family:'Inter'/);
 assert.match(iconUpgrade,/spriteIcon\('arrow-up-right'\)/);
 assert.doesNotMatch(root,/[◇▤✳]/,'no Unicode pseudo-icons on landing');
 assert.doesNotMatch(business,/class="brand-glyph">◇/,'business logo must use SVG');
});

test('verification presents independently queried testnet data before browser sample records',()=>{
 const html=read('verify/index.html');
 assert.ok(html.indexOf('id="testnet-lookup"')<html.indexOf('id="verify-form"'),'onchain verification must precede fictional sample form');
 assert.match(html,/verify-v3/);
 assert.match(html,/ui-enhance\.mjs/);
 assert.match(html,/No wallet connection or signature required/);
});

test('manufacturer and consumer use distinct app shells without changing contract actions',()=>{
 const b=read('business/index.html'),c=read('app/index.html'),css=read('shells.css');
 const live=read('app/live.mjs'),nav=read('app/app.js');
 assert.match(b,/business-v4/);
 assert.match(c,/consumer-v4/);
 assert.match(b,/bs-primary-nav/);
 assert.match(b,/bs-pinned-nav/);
 assert.match(c,/cs-side-links/);
 assert.match(c,/cs-mobile-portfolio/);
 assert.match(c,/cs-nav-label/);
 assert.match(css,/background:#050506/);
 assert.match(css,/background:#fff/);
 assert.match(css,/border-radius:999px/);
 assert.match(live,/cs-mobile-live-count/);
 assert.match(nav,/cs-desktop-context/);
 assert.match(c,/wallet\/consumer\.mjs/);
 assert.match(b,/wallet\/manufacturer\.mjs/);
});
