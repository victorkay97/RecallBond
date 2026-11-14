import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('judges have an open, clearly labeled walkthrough without account credentials',()=>{
 const html=read('./judge/index.html');
 assert.match(html,/NEAR HACKATHON 2026/);
 assert.match(html,/Judge walkthrough/i);
 assert.match(html,/href="\.\.\/app\/"/);
 assert.match(html,/href="\.\.\/business\/"/);
 assert.match(html,/href="\.\.\/verify\/\?id=RB-NV-002891"/);
 assert.match(html,/Sample workspaces are explicitly simulated/i);
 assert.match(html,/account-signed browser transactions/i);
 assert.match(html,/github\.com\/victorkay97\/RecallBond/);
 const receiptIds=[
  'AsGyzqgtgCs23EUBN4yCfdgRdSjoz4AA8p3VQnt5hucN',
  '49TB1NbHQLNjfhi1eALV7yCBahef3L9AXZ7XCpWUFcMo',
  'CpeFEKMSEjG5vvRu4moBDD3c43rY6dEWzakSJSuCTXHJ',
  '2TrjKqrjoLcjX2McdB1ntE2bJwZRJARUznxPQnSHuLNL',
  'HmYwR5dw1BMrsNpsHWjiXsTAv5AJQwJafMRhcKxku5vX',
  '6zLUqcwAvcf1cEhNVPjkUZrhLH66a3xmjFxTGbP23eru'
 ];
 for(const id of receiptIds)assert.ok(html.includes(id),'missing existing verified contract receipt '+id);
 assert.doesNotMatch(html,/privateKey|seedPhrase|password\W*[:=]\W*["']/);
});
test('premium visual system preserves Inter and Geist, responsive layout and accessibility',()=>{
 const css=read('./judge/judge.css'),shared=read('./premium.css');
 assert.match(css,/Inter/);
 assert.match(css,/Geist/);
 assert.match(css,/@media\(max-width:690px\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(shared,/Inter|RecallBond's Geist \+ Inter/);
 assert.match(shared,/focus-visible/);
 assert.match(shared,/prefers-reduced-motion/);
 for(const file of ['./index.html','./account/index.html','./studio/index.html','./admin/index.html','./app/index.html','./business/index.html']){
  assert.match(read(file),/premium\.css/,'missing premium layer in '+file);
 }
 assert.match(read('./index.html'),/href="\.\/judge\/"/);
});
test('admin URL reveals no data without a verified membership',()=>{
 const ui=read('./admin/admin.mjs'),api=read('./api/admin.js'),html=read('./admin/index.html');
 assert.match(ui,/let snapshot=null,tab='overview',busy=false,authorized=false/);
 assert.match(ui,/if\(!authorized\|\|!labels\[next\]\)return/);
 assert.match(ui,/data\?\.administrator\?\.email/);
 assert.match(ui,/document\.querySelector\('\.adm-nav'\)\.hidden=true/);
 assert.match(ui,/Private operator workspace/);
 assert.match(api,/JOIN rb_admin_memberships/);
 assert.match(api,/s\.revoked_at IS NULL/);
 assert.match(api,/u\.suspended_at IS NULL/);
 assert.match(html,/noindex,nofollow/);
 assert.doesNotMatch(api,/role='admin'|default_admin_password/i);
});
