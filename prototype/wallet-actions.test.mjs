import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT, NOVATECH, isNearAccountId, toYoctoNear, fromYoctoNear, sendContractCall } from './wallet/client.mjs';
import { readFileSync } from 'node:fs';
const load = p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('NEAR amount conversion is exact for 24-digit precision',()=>{
 assert.equal(toYoctoNear('0.1'),'100000000000000000000000');
 assert.equal(toYoctoNear('1'),'1000000000000000000000000');
 assert.equal(toYoctoNear('0.000000000000000000000001'),'1');
 assert.equal(fromYoctoNear('100000000000000000000000'),'0.1');
 assert.equal(fromYoctoNear('0'),'0');
 assert.throws(()=>toYoctoNear('1.0000000000000000000000001'),/valid/);
 assert.throws(()=>toYoctoNear('-1'),/valid/);
});
test('account IDs validate and issuer/contract are the expected testnet targets',()=>{
 assert.equal(isNearAccountId('novatech-vk97-261112.testnet'),true);
 assert.equal(isNearAccountId('SOMEONE.testnet'),false);
 assert.equal(isNearAccountId('bad name.testnet'),false);
 assert.equal(CONTRACT,'rb-vk97-261112.testnet');
 assert.equal(NOVATECH,'novatech-vk97-261112.testnet');
});
test('signed calls require a connected wallet and restrict methods',async()=>{
 await assert.rejects(sendContractCall(null,{method:'withdraw_compensation',args:{}}),/Connect/);
 const wallet={signAndSendTransaction:async payload=>payload};
 await assert.rejects(sendContractCall(wallet,{method:'register_manufacturer',args:{}}),/Unsupported/);
 const payload=await sendContractCall(wallet,{method:'nft_transfer',args:{receiver_id:'recipient.testnet',token_id:'RB-001'},deposit:'1'});
 assert.equal(payload.receiverId,CONTRACT);
 assert.deepEqual(payload.actions,[{type:'FunctionCall',params:{
   methodName:'nft_transfer',
   args:{receiver_id:'recipient.testnet',token_id:'RB-001'},
   gas:'100000000000000',deposit:'1'
 }}]);
});
test('wallet interfaces require explicit user clicks and are not automatically signed',()=>{
 const consumer=load('./wallet/consumer.mjs');
 const issuer=load('./wallet/manufacturer.mjs');
 const consumerHtml=load('./app/index.html');
 const businessHtml=load('./business/index.html');
 assert.match(consumer,/window\.confirm/);
 assert.match(issuer,/window\.confirm/);
 assert.match(consumerHtml,/signed-transfer/);
 assert.match(consumerHtml,/signed-claim/);
 assert.match(businessHtml,/issuer-mint/);
 assert.match(businessHtml,/issuer-fund-campaign/);
 assert.match(issuer,/state\.accountId!==NOVATECH/);
 assert.match(consumer,/product\.value\.owner_id!==state\.accountId/);
 assert.match(consumer,/claimant\.value!==null/);
 assert.match(consumer,/remaining.*claim|Already claimed/);
 assert.doesNotMatch(consumer+issuer,/privateKey|mnemonic|seedPhrase|save-to-keychain/);
});
