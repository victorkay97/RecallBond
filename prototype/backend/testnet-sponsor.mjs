// A tightly capped NEAR testnet sponsor. It NEVER uses the contract admin's signing key.
// Funding is separately approved and rate limited by a unique database slot per UTC day.
import {Account,JsonRpcProvider,nearToYocto} from 'near-api-js';
import {NEAR} from 'near-api-js/tokens';
export const RPC_URL='https://test.rpc.fastnear.com';
export const CONTRACT_ID='rb-vk97-261112.testnet';
const rpc=new JsonRpcProvider({url:RPC_URL});
export function sponsorConfigured(){
 return /^[a-z0-9_.-]+\.testnet$/.test(process.env.RB_SPONSOR_ACCOUNT_ID||'') &&
 /^ed25519:[1-9A-HJ-NP-Za-km-z]{60,}$/.test(process.env.RB_SPONSOR_PRIVATE_KEY||'');
}
export function accountWithKey(id,key){if(!/^ed25519:[1-9A-HJ-NP-Za-km-z]{60,}$/.test(key))throw Error('Missing signing credential');return new Account(id,rpc,key);}
export async function accountExists(accountId){
 if(!/^[0-9a-f]{64}$/.test(accountId))throw Error('Invalid NEAR implicit ID');
 const response=await fetch(RPC_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
  jsonrpc:'2.0',id:'rb-account-state',method:'query',params:{request_type:'view_account',finality:'final',account_id:accountId}
 }),signal:AbortSignal.timeout(15000)});
 const data=await response.json();
 if(data.error){
  const detail=JSON.stringify(data.error);
  if(detail.includes('UNKNOWN_ACCOUNT')||detail.includes('does not exist')||detail.includes('not found')||detail.includes('Unknown account'))return false;
  throw Error('NEAR account lookup failed');
 }
 return Boolean(data.result?.amount!==undefined);
}
export async function sponsorImplicitAccount(accountId,role){
 if(!sponsorConfigured())throw Error('Sponsor not configured');
 if(!/^[0-9a-f]{64}$/.test(accountId))throw Error('Invalid NEAR implicit ID');
 const amount=role==='manufacturer'?'1.2':'0.05';
 const sponsor=accountWithKey(process.env.RB_SPONSOR_ACCOUNT_ID,process.env.RB_SPONSOR_PRIVATE_KEY);
 const available=BigInt(await sponsor.getBalance());
 const required=BigInt(nearToYocto(amount))+BigInt(nearToYocto('0.2'));
 if(available<required)throw Error('Sponsor balance below safe reserve');
 const result=await sponsor.transfer({token:NEAR,amount:NEAR.toUnits(amount),receiverId:accountId});
 if(result?.status?.Failure)throw Error('Sponsor transaction failed');
 const txHash=result?.transaction?.hash||result?.transaction_outcome?.id;
 return {txHash:typeof txHash==='string'?txHash:null,amountYocto:nearToYocto(amount)};
}
