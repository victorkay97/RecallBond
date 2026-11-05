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
 assert.match(verify,/No signup, no wallet/);
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
 assert.match(business,/Business studio · Demo/);
 assert.match(business,/No manufacturer was authenticated/);
 assert.match(business,/No deposit occurred|No blockchain transaction or product registration occurred|No NFT will be minted/);
});
