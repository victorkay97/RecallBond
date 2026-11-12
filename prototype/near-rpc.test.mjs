import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAccountId, viewCall, verifyPassportOnTestnet } from './verify/testnet-rpc.mjs';
const contractId='recallbond.testnet';
const tokenId='RB-NV-002891';
function rpcResponse(value) {
 const encoded=Array.from(new TextEncoder().encode(JSON.stringify(value)));
 return { ok:true, json:async()=>({ jsonrpc:'2.0', id:'recallbond-verify',
  result:{ result:encoded, block_height:987654, block_hash:'exampleBlock' } }) };
}
test('testnet verifier encodes a public read-only view call, hides owner and serial details',async()=>{
 let outgoing;
 const result=await verifyPassportOnTestnet({contractId,tokenId,
   fetchImpl:async (url,options)=>{outgoing={url,options};return rpcResponse({
     token_id:tokenId, manufacturer:'fictional-issuer.testnet', batch_id:'BATTERY-X21',
     owner_id:'should-not-be-exposed.testnet', serial_commitment:'private-commitment'
   });}});
 assert.equal(result.found,true);
 assert.equal(result.manufacturer,'fictional-issuer.testnet');
 assert.equal(result.batch,'BATTERY-X21');
 assert.equal(result.blockHeight,987654);
 assert.ok(!('owner_id' in result));
 assert.ok(!('serial_commitment' in result));
 assert.equal(outgoing.options.method,'POST');
 const request=JSON.parse(outgoing.options.body);
 assert.equal(request.method,'query');
 assert.equal(request.params.request_type,'call_function');
 assert.equal(request.params.method_name,'get_product');
 assert.equal(request.params.finality,'final');
 assert.equal(request.params.account_id,contractId);
 assert.deepEqual(JSON.parse(Buffer.from(request.params.args_base64,'base64').toString()), {token_id:tokenId});
});
test('unregistered token yields a clear not-found record, not a fabricated owner',async()=>{
 const result=await verifyPassportOnTestnet({contractId,tokenId,fetchImpl:async()=>rpcResponse(null)});
 assert.equal(result.found,false);
 assert.ok(!('manufacturer' in result));
});
test('reject unsafe contract IDs, non-view calls and invalid token IDs',async()=>{
 assert.equal(validateAccountId('A BAD ACCOUNT'),false);
 assert.equal(validateAccountId('testnet.contract'),true);
 await assert.rejects(viewCall({contractId:'INVALID ACCOUNT',method:'get_product',args:{token_id:tokenId}}),/valid/);
 await assert.rejects(viewCall({contractId,method:'fund_campaign'}),/not permitted/);
 await assert.rejects(verifyPassportOnTestnet({contractId,tokenId:''}),/valid/);
});
test('surface RPC and response failures instead of misrepresenting network state',async()=>{
 await assert.rejects(verifyPassportOnTestnet({contractId,tokenId,fetchImpl:async()=>{throw new Error('network')}}),/unavailable/);
 await assert.rejects(verifyPassportOnTestnet({contractId,tokenId,fetchImpl:async()=>({ok:false,status:503})}),/HTTP 503/);
 await assert.rejects(verifyPassportOnTestnet({contractId,tokenId,fetchImpl:async()=>({ok:true,json:async()=>({error:{message:'not found'}})})}),/rejected/);
 await assert.rejects(verifyPassportOnTestnet({contractId,tokenId,fetchImpl:async()=>rpcResponse({foo:'bar'})}),/incompatible/);
});
