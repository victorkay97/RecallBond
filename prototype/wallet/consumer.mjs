import { viewCall } from '../verify/testnet-rpc.mjs';
import { CONTRACT, isNearAccountId, getConnector, currentWallet, connectWallet, disconnectWallet, sendContractCall, toYoctoNear, fromYoctoNear } from './client.mjs';
const root=document.getElementById('consumer-wallet-tools');
if(root){
 const $=q=>root.querySelector(q);
 const state={wallet:null,accountId:null,credit:'0',busy:false};
 const setMessage=(msg,error=false)=>{const el=$('[data-near-message]');el.textContent=msg;el.style.color=error?'#ffb1a6':'#b9efc6'};
 const setBusy=busy=>{state.busy=busy;root.querySelectorAll('button').forEach(b=>b.disabled=busy)};
 const sayConnected=()=>{
   $('[data-near-connect]').hidden=!!state.wallet;
   $('[data-near-disconnect]').hidden=!state.wallet;
   $('[data-near-connected]').hidden=!state.wallet;
   $('[data-near-status]').textContent=state.wallet?'Connected · Testnet':'Disconnected';
   $('[data-near-account]').textContent=state.accountId||'No account linked';
 };
 async function getBalance(accountId){
   const body={jsonrpc:'2.0',id:'rb-balance',method:'query',params:{request_type:'view_account',account_id:accountId,finality:'final'}};
   const response=await fetch('https://test.rpc.fastnear.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!response.ok)throw Error('Wallet balance RPC failed');
   const data=await response.json();
   if(data.error||!data.result?.amount)throw Error('Wallet balance could not be verified');
   return data.result.amount;
 }
 async function refresh(){
   const session=await currentWallet();
   state.wallet=session.wallet;
   state.accountId=session.accountId;
   sayConnected();
   if(!session.wallet||!session.accountId)return;
   try{
     const [credit,owned,balance]=await Promise.all([
       viewCall({contractId:CONTRACT,method:'get_credit',args:{account_id:session.accountId}}),
       viewCall({contractId:CONTRACT,method:'nft_tokens_for_owner',args:{account_id:session.accountId,from_index:'0',limit:100}}),
       getBalance(session.accountId)
     ]);
     if(!Array.isArray(owned.value))throw Error('Unexpected passport list from contract');
     state.credit=String(credit.value);
     $('[data-near-balance]').textContent=fromYoctoNear(balance)+' NEAR';
     $('[data-near-credit]').textContent=fromYoctoNear(state.credit)+' NEAR';
     $('[data-near-count]').textContent=String(owned.value.length);
     $('[data-near-owned]').textContent=owned.value.length?
        'Your onchain passports: '+owned.value.map(t=>t.token_id).join(', '):
        'No RecallBond passports currently belong to this connected account.';
     $('[data-near-withdraw]').disabled=BigInt(state.credit)<=0n;
   }catch(err){setMessage('Connected, but some blockchain account details could not load: '+err.message,true)}
 }
 async function withBusy(action){
   if(state.busy)return;
   setBusy(true);
   try{await action()}catch(err){setMessage(err instanceof Error?err.message:'Wallet action failed.',true)}
   finally{setBusy(false);if(state.wallet && BigInt(state.credit)<=0n)$('[data-near-withdraw]').disabled=true;}
 }
 $('[data-near-connect]').addEventListener('click',()=>withBusy(async()=>{
   setMessage('Opening your NEAR testnet wallet picker…');
   await connectWallet();
   await refresh();
   if(!state.wallet)setMessage('Wallet connection has not completed yet. Approve it in the wallet.',false);
   else setMessage('Wallet connected. You control all signatures.');
 }));
 $('[data-near-disconnect]').addEventListener('click',()=>withBusy(async()=>{
   await disconnectWallet(state.wallet);
   state.wallet=null;state.accountId=null;state.credit='0';
   sayConnected();setMessage('Wallet disconnected from the demo.');
 }));
 const ensureWallet=()=>{if(!state.wallet||!isNearAccountId(state.accountId))throw Error('Connect a valid NEAR testnet wallet first.');};
 const finalizeNotice=async(method)=>{
   setMessage('Wallet request for '+method+' returned. Rechecking finalized blockchain records…');
   await refresh();
   setMessage('Wallet request completed. Inspect the transaction in your wallet/explorer; updated finalized state is shown above. Do not resubmit blindly.');
 };
 $('#signed-transfer').addEventListener('submit',e=>{e.preventDefault();withBusy(async()=>{
   ensureWallet();
   const tokenId=$('#signed-transfer-token').value.trim();
   const receiver=$('#signed-transfer-to').value.trim().toLowerCase();
   if(!tokenId||tokenId.length>128||!isNearAccountId(receiver)||receiver===state.accountId)throw Error('Enter a valid token ID and a different recipient account.');
   const product=await viewCall({contractId:CONTRACT,method:'get_product',args:{token_id:tokenId}});
   if(!product.value)throw Error('This passport does not exist on RecallBond.');
   if(product.value.owner_id!==state.accountId)throw Error('Only the current onchain owner can transfer this passport.');
   if(!window.confirm('Transfer '+tokenId+' from '+state.accountId+' to '+receiver+' on NEAR TESTNET? This changes the current registered owner and unclaimed recall eligibility.'))return;
   await sendContractCall(state.wallet,{method:'nft_transfer',args:{token_id:tokenId,receiver_id:receiver},deposit:'1'});
   await finalizeNotice('NFT transfer');
 })});
 $('#signed-claim').addEventListener('submit',e=>{e.preventDefault();withBusy(async()=>{
   ensureWallet();
   const tokenId=$('#signed-claim-token').value.trim();
   const campaignId=Number($('#signed-claim-campaign').value);
   if(!tokenId||!Number.isSafeInteger(campaignId)||campaignId<0)throw Error('Enter a valid passport and campaign ID.');
   const [product,campaign,claimant]=await Promise.all([
     viewCall({contractId:CONTRACT,method:'get_product',args:{token_id:tokenId}}),
     viewCall({contractId:CONTRACT,method:'get_campaign',args:{id:campaignId}}),
     viewCall({contractId:CONTRACT,method:'get_claimant',args:{campaign_id:campaignId,token_id:tokenId}})
   ]);
   if(!product.value || product.value.owner_id!==state.accountId)throw Error('This passport is not owned by the connected wallet.');
   if(claimant.value!==null)throw Error('Already claimed. The NFT cannot receive a second recall payout.');
   const c=campaign.value;
   if(!c||!c.activated||c.closed||c.batch_id!==product.value.batch_id||c.manufacturer!==product.value.manufacturer||BigInt(c.expiry_ns)<BigInt(Date.now())*1000000n||BigInt(c.funded_yocto)<BigInt(c.payout_yocto))throw Error('Campaign not eligible, active or sufficiently reserved.');
   if(!window.confirm('Claim '+fromYoctoNear(c.payout_yocto)+' testnet NEAR credit for '+tokenId+'? A 1 testnet NEAR storage deposit will be attached and unused storage funds refunded by the contract.'))return;
   await sendContractCall(state.wallet,{method:'claim_compensation',args:{campaign_id:campaignId,token_id:tokenId},deposit:toYoctoNear('1')});
   await finalizeNotice('recall claim');
 })});
 $('[data-near-withdraw]').addEventListener('click',()=>withBusy(async()=>{
   ensureWallet();
   const result=await viewCall({contractId:CONTRACT,method:'get_credit',args:{account_id:state.accountId}});
   if(BigInt(result.value)<=0n)throw Error('There is no onchain compensation credit to withdraw.');
   if(!window.confirm('Withdraw the entire '+fromYoctoNear(result.value)+' testnet NEAR claim credit to your connected wallet?'))return;
   await sendContractCall(state.wallet,{method:'withdraw_compensation',args:{},deposit:'0'});
   await finalizeNotice('withdrawal');
 }));
 // Restore an existing connection without showing a wallet popup.
 try {
   const connector=await getConnector();
   connector.on('wallet:signIn',()=>{refresh().catch(()=>{})});
   connector.on('wallet:signOut',()=>{state.wallet=null;state.accountId=null;state.credit='0';sayConnected()});
   await refresh();
 } catch(err){
   setMessage('Wallet connector is temporarily unavailable. The public read-only testnet proofs above remain accessible.',true);
 }
}
