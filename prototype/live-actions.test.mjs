import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('sponsor transfer requires verified account, dedicated signer, exact one-use slot and funded NEAR',()=>{
 const sql=read('backend/sponsor.sql'),api=read('api/wallet.js'),near=read('backend/testnet-sponsor.mjs');
 assert.match(sql,/PRIMARY KEY REFERENCES rb_users/);
 assert.match(sql,/UNIQUE \(funding_day,funding_slot\)/);
 assert.match(sql,/manual_review/);
 assert.match(api,/email_verified_at/);
 assert.match(api,/company_status!==.*verified/);
 assert.match(api,/ON CONFLICT DO NOTHING/);
 assert.match(api,/maxSlots=Math\.max\(1,Math\.min\(5/);
 assert.match(api,/status='manual_review'/);
 assert.match(api,/sponsorConfigured\(\)/);
 assert.match(api,/s\.revoked_at IS NULL AND u\.suspended_at IS NULL/);
 assert.match(near,/new Account\(id,rpc,key\)|new Account\(accountId,rpc,key\)|new Account\(id,provider,key\)/);
 assert.match(near,/test\.rpc\.fastnear\.com/);
 assert.match(near,/RB_SPONSOR_PRIVATE_KEY/);
 assert.match(near,/NEAR\.toUnits\(amount\)/);
 assert.doesNotMatch(near,/rb-vk97-261112\.testnet.{0,70}PRIVATE_KEY/);
});

test('chain actions enforce session, role, current NFT ownership and exact campaign reserve',()=>{
 const api=read('api/chain.js'),schema=read('backend/onchain-index.sql'),auth=read('api/auth.js');
 for(const name of ['mint_product','nft_transfer','create_campaign','fund_campaign','activate_campaign',
                    'claim_compensation','withdraw_compensation'])
  assert.match(api,new RegExp(name));
 assert.match(api,/decryptWalletSecret\(u\.encrypted_secret/);
 assert.match(api,/checkOrigin\(req\)/);
 assert.match(api,/s\.revoked_at IS NULL/);
 assert.match(api,/u\.suspended_at IS NULL/);
 assert.match(api,/product\.owner_id!==u\.near_account_id/);
 assert.match(api,/remaining=BigInt\(state\.max_liability_yocto\)-BigInt\(state\.funded_yocto\)/);
 assert.match(api,/verified manufacturer/i);
 assert.match(api,/rb_onchain_products/);
 assert.match(schema,/rb_chain_audit/);
 assert.match(auth,/Only the current onchain passport owner can report/);
 assert.match(auth,/organization_id/);
 assert.doesNotMatch(api,/secretKey:\s*u\.encrypted_secret/);
});

test('live studio renders role-aware action forms and real-data indicators with SVG icons',()=>{
 const html=read('studio/index.html'),script=read('studio/studio.mjs'),css=read('studio/studio.css');
 for(const id of ['consumer-passports','consumer-recalls','consumer-transfer','consumer-issue',
  'manufacturer-mint','manufacturer-campaign','manufacturer-products','manufacturer-campaigns','manufacturer-issues'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/mingcute\.svg#shield/);
 assert.match(html,/mingcute\.svg#transfer/);
 assert.match(script,/api\('chain','portfolio'\)/);
 assert.match(script,/api\('chain','manufacturer'\)/);
 assert.match(script,/requireReady\(\)/);
 assert.match(script,/getElementById|document\.querySelector/);
 assert.doesNotMatch(script,/innerHTML\s*=/);
 assert.match(css,/@media\(max-width:760px\)/);
});
