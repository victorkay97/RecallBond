import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { Worker } from 'near-workspaces';

const WASM=resolve(process.cwd(),'../contract/target/wasm32-unknown-unknown/release/recallbond.wasm');
const YOCTO='1000000000000000000000000';
const PAYOUT='100000000000000000000000'; // 0.1 NEAR
const futureNs=2200000000000000000; // calendar date in future
let worker;
const expectRejected=async (operation,description)=>{
 let rejected=false;
 try {await operation();} catch(e) {rejected=true;console.log('EXPECTED REJECTION:',description);}
 assert.ok(rejected,description+' should fail');
};
try {
 worker=await Worker.init();
 const rpcAddress=worker.config?.rpcAddr || worker.provider?.connection?.url || worker.rootAccount?.connection?.provider?.connection?.url;
 console.log('SANDBOX EXECUTABLE',process.env.NEAR_SANDBOX_BIN_PATH || '(dependency default)');
 console.log('SANDBOX RPC',rpcAddress || '(not exposed by wrapper)');
 if (rpcAddress) {
  for (const method of ['EXPERIMENTAL_genesis_config','status']) {
   try {
    const result=await fetch(rpcAddress,{method:'POST',headers:{'content-type':'application/json'},
     body:JSON.stringify({jsonrpc:'2.0',id:'diagnostic',method,params:[]})}).then(r=>r.json());
    const conf=result.result || {};
    console.log('SANDBOX DIAGNOSTIC',method,JSON.stringify({
      protocol_version:conf.protocol_version,
      latest_protocol_version:conf.sync_info?.latest_protocol_version,
      chain_id:conf.chain_id,
      version:conf.version?.version,
      error:result.error?.message
    }));
   } catch(e) { console.log('SANDBOX DIAGNOSTIC unavailable:',String(e).slice(0,200)); }
  }
 }
 const root=worker.rootAccount;
 const contract=await root.devDeploy(WASM);
 const issuer=await root.createSubAccount('novatech');
 const ada=await root.createSubAccount('ada');
 const tomi=await root.createSubAccount('tomi');

 await contract.call(contract,'new',{admin:root.accountId});
 await root.call(contract,'register_manufacturer',{manufacturer:issuer.accountId},{attachedDeposit:YOCTO});
 await issuer.call(contract,'mint_product',{
  token_id:'NV-001',
  owner_id:ada.accountId,
  batch_id:'BATTERY-X21',
  serial_commitment:'a'.repeat(64),
  token_metadata:{title:'NovaBook Air',description:'Fictional recall product',copies:1},
 },{attachedDeposit:YOCTO});
 let p=await contract.view('get_product',{token_id:'NV-001'});
 assert.equal(p.owner_id,ada.accountId);
 console.log('PASS: NFT issued to Ada on Sandbox');

 await ada.call(contract,'nft_transfer',{receiver_id:tomi.accountId,token_id:'NV-001'},{attachedDeposit:'1'});
 p=await contract.view('get_product',{token_id:'NV-001'});
 assert.equal(p.owner_id,tomi.accountId);
 console.log('PASS: NEP-171 transfer to Tomi');

 const id=await issuer.call(contract,'create_campaign',{
  batch_id:'BATTERY-X21',payout_yocto:PAYOUT,expiry_ns:futureNs,
 },{attachedDeposit:YOCTO});
 assert.equal(Number(id),0);
 await issuer.call(contract,'fund_campaign',{campaign_id:id},{attachedDeposit:PAYOUT});
 await issuer.call(contract,'activate_campaign',{campaign_id:id});
 const campaign=await contract.view('get_campaign',{id});
 assert.equal(campaign.activated,true);
 assert.equal(campaign.funded_yocto,PAYOUT);
 console.log('PASS: fully collateralized recall campaign');

 await expectRejected(()=>ada.call(contract,'claim_compensation',{
  campaign_id:id,token_id:'NV-001'
 },{attachedDeposit:YOCTO}),'former owner');
 const credit=await tomi.call(contract,'claim_compensation',{
  campaign_id:id,token_id:'NV-001'
 },{attachedDeposit:YOCTO});
 assert.equal(credit,PAYOUT);
 assert.equal(await contract.view('get_credit',{account_id:tomi.accountId}),PAYOUT);
 console.log('PASS: rightful claimant credited');

 await expectRejected(()=>tomi.call(contract,'claim_compensation',{
  campaign_id:id,token_id:'NV-001'
 },{attachedDeposit:YOCTO}),'duplicate claim');
 await tomi.call(contract,'withdraw_compensation',{});
 assert.equal(await contract.view('get_credit',{account_id:tomi.accountId}),'0');
 assert.equal((await contract.view('get_campaign',{id})).funded_yocto,'0');
 console.log('PASS: completed NEAR Sandbox payout and accounting');
 console.log('SANDBOX END-TO-END PASS');
} finally {
 if(worker) await worker.tearDown();
}
