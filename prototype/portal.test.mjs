import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const content=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('all three portals have route index files',()=>{
 for(const x of ['business/index.html','app/index.html','verify/index.html']){
  assert.ok(existsSync(new URL(x,import.meta.url)),x);
 }
});
test('public verification has no login requirement or owner identity lookup',()=>{
 const html=content('verify/index.html');
 assert.match(html,/No account needed/);
 assert.match(html,/Owner|Ownership/);
 assert.doesNotMatch(html,/tomi\.testnet|ada\.testnet|@[a-z]+\.com/i);
 assert.match(html,/QR codes identify passports/);
});
test('consumer wallet distinguishes contract credit from available funds',()=>{
 const html=content('app/index.html');
 assert.match(html,/Approved claim credit/);
 assert.match(html,/Available in NEAR wallet/);
 assert.match(html,/Simulation only/);
});
test('manufacturer preview is not claimed to be authorized production portal',()=>{
 const html=content('business/index.html');
 assert.match(html,/Simulated preview/);
 assert.match(html,/No company verified/);
});
