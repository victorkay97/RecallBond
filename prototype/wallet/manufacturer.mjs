// NovaTech testnet dashboard signing. Only the connected issuer wallet can authorize writes.
import { viewCall } from '../verify/testnet-rpc.mjs';
import { CONTRACT, NOVATECH, isNearAccountId, toYoctoNear, fromYoctoNear, getConnector, connectWallet, disconnectWallet, currentWallet, sendContractCall } from './client.mjs';
const root=document.getElementById('b-products');
if(root) {
  const $=q=>document.querySelector(q), state={wallet:null,accountId:null,busy:false};
  const msg=(text,bad=false)=>{const node=$('[data-issuer-message]');node.textContent=text;node.style.color=bad?'#ffb1a6':'#b8f4c6'};
  const validIssuer=()=>{if(!state.wallet||state.accountId!==NOVATECH)throw Error('Issuer actions require the actual registered NovaTech testnet wallet.');};
  const busy=value=>{state.busy=value;document.querySelectorAll('[data-issuer-connect],[data-issuer-disconnect],#issuer-mint button,#issuer-create-campaign button,#issuer-fund-campaign,#issuer-activate-campaign').forEach(b=>b.disabled=value)};
  const render=()=>{
   const connected=Boolean(state.wallet);
   $('[data-issuer-connect]').hidden=connected;
   $('[data-issuer-disconnect]').hidden=!connected;
   $('[data-issuer-account]').textContent=state.accountId||'Awaiting NEAR testnet wallet';
   $('[data-issuer-status]').textContent=!connected?'Not connected':state.accountId===NOVATECH?'Authorized NovaTech issuer':'Other account · Read only';
   $('[data-issuer-forms]').hidden=state.accountId!==NOVATECH;
   $('[data-issuer-campaign-forms]').hidden=state.accountId!==NOVATECH;
  };
  const refresh=async()=>{const s=await currentWallet();state.wallet=s.wallet;state.accountId=s.accountId;render()};
  const run=async action=>{if(state.busy)return;busy(true);try{await action()}catch(e){msg(e instanceof Error?e.message:'Wallet action unavailable',true)}finally{busy(false)}};
  $('[data-issuer-connect]').addEventListener('click',()=>run(async()=>{msg('Opening NEAR testnet wallet picker…');await connectWallet();await refresh();msg(state.accountId===NOVATECH?'NovaTech account connected. Wallet confirmation is required for each action.':'Connected account is not the registered NovaTech issuer.');}));
  $('[data-issuer-disconnect]').addEventListener('click',()=>run(async()=>{await disconnectWallet(state.wallet);state.wallet=null;state.accountId=null;render();msg('Disconnected.');}));
  async function signed(method,args,deposit='0'){
    validIssuer();
    await sendContractCall(state.wallet,{method,args,deposit});
    msg('Wallet transaction request returned. Independently refresh the public ledger and inspect the explorer receipt before retrying.');
  }
  $('#issuer-mint').addEventListener('submit',event=>{event.preventDefault();run(async()=>{
    validIssuer();
    const tokenId=$('#issuer-token').value.trim(),title=$('#issuer-title').value.trim(),batch=$('#issuer-batch').value.trim(),owner=$('#issuer-owner').value.trim().toLowerCase();
    if(tokenId.length<4||tokenId.length>128||title.length<2||title.length>80||batch.length<2||batch.length>100||!isNearAccountId(owner))throw Error('Enter a valid unique token ID, title, batch and recipient.');
    if(batch==='BATTERY-X21')throw Error('This batch is frozen by the existing recall. Use a new testnet batch.');
    const existing=await viewCall({contractId:CONTRACT,method:'get_product',args:{token_id:tokenId}});
    if(existing.value!==null)throw Error('This token ID is already registered. Choose a unique ID.');
    // Deliberately do not collect sensitive device serials in the browser demo.
    const salt=crypto.getRandomValues(new Uint8Array(32));
    const commitment=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('recallbond-test-only:'+tokenId+':'+Array.from(salt,b=>b.toString(16).padStart(2,'0')).join('')));
    const serial_commitment=Array.from(new Uint8Array(commitment),b=>b.toString(16).padStart(2,'0')).join('');
    const args={token_id:tokenId,owner_id:owner,batch_id:batch,serial_commitment,
      token_metadata:{title,description:'Fictional NovaTech testnet product passport. No real product serial or warranty.'}};
    if(!window.confirm('ISSUE REAL TESTNET NFT\nPassport: '+tokenId+'\nTitle: '+title+'\nRecipient: '+owner+'\nBatch: '+batch+'\nAttach 1 testnet NEAR for storage (unused refunded). Continue?'))return;
    await signed('mint_product',args,toYoctoNear('1'));
  })});
  $('#issuer-create-campaign').addEventListener('submit',event=>{event.preventDefault();run(async()=>{
    validIssuer();
    const batch=$('#issuer-recall-batch').value.trim(),payout=$('#issuer-recall-payout').value.trim(),expiry=$('#issuer-recall-expiry').value;
    if(batch.length<2||batch.length>100||batch==='BATTERY-X21')throw Error('Use an existing NovaTech batch which has not already been frozen.');
    const amount=toYoctoNear(payout);
    if(BigInt(amount)===0n)throw Error('Payout must be greater than zero.');
    const deadline=Date.parse(expiry+'T23:59:59Z');
    if(!Number.isFinite(deadline)||deadline<Date.now()+3600_000)throw Error('Expiry must be a future UTC day.');
    // serde expects a JSON integer u64; the nanosecond value is approximate to 256ns precision in JS.
    const expiryNs=Number(BigInt(deadline)*1000000n);
    const list=await viewCall({contractId:CONTRACT,method:'nft_tokens',args:{from_index:'0',limit:100}});
    if(!Array.isArray(list.value)||!list.value.length)throw Error('No registered passports exist yet.');
    const products=await Promise.all(list.value.map(t=>viewCall({contractId:CONTRACT,method:'get_product',args:{token_id:t.token_id}})));
    const eligible=products.filter(p=>p.value?.batch_id===batch&&p.value?.manufacturer===NOVATECH).length;
    if(!eligible)throw Error('No NovaTech passports found in this batch; mint the products first.');
    if(!window.confirm('CREATE TESTNET RECALL\nAffected batch: '+batch+'\nEligible passports observed (first 100): '+eligible+'\nCompensation: '+payout+' testnet NEAR each.\nCampaign creation freezes the batch. Approve a storage deposit up to 1 testnet NEAR?'))return;
    await signed('create_campaign',{batch_id:batch,payout_yocto:amount,expiry_ns:expiryNs},toYoctoNear('1'));
  })});
  async function loadCampaign(){
    validIssuer();
    const id=Number($('#issuer-recall-id').value);
    if(!Number.isSafeInteger(id)||id<1)throw Error('Select a NEW campaign ID greater than zero. Campaign #0 is settled.');
    const res=await viewCall({contractId:CONTRACT,method:'get_campaign',args:{id}});
    const c=res.value;
    if(!c||c.id!==id||c.manufacturer!==NOVATECH||c.closed||BigInt(c.expiry_ns)<BigInt(Date.now())*1000000n)throw Error('Campaign not found, wrong issuer or expired/closed.');
    return c;
  }
  $('#issuer-fund-campaign').addEventListener('click',()=>run(async()=>{
    const c=await loadCampaign();
    if(c.activated)throw Error('This campaign is already active.');
    const remaining=BigInt(c.max_liability_yocto)-BigInt(c.funded_yocto);
    if(remaining<=0n)throw Error('This campaign is already fully funded.');
    if(!window.confirm('FUND CAMPAIGN #'+c.id+'\nExactly '+fromYoctoNear(remaining.toString())+' TESTNET NEAR will be attached and reserved. This deposit is not a gas fee. Continue to wallet approval?'))return;
    await signed('fund_campaign',{campaign_id:c.id},remaining.toString());
  }));
  $('#issuer-activate-campaign').addEventListener('click',()=>run(async()=>{
    const c=await loadCampaign();
    if(c.activated)throw Error('Already active.');
    if(BigInt(c.funded_yocto)!==BigInt(c.max_liability_yocto))throw Error('Full compensation liability must be funded before activation.');
    if(!window.confirm('ACTIVATE FULLY FUNDED TESTNET RECALL #'+c.id+' for '+c.eligible_count+' eligible passports?'))return;
    await signed('activate_campaign',{campaign_id:c.id},'0');
  }));
  try{
    const connector=await getConnector();
    connector.on('wallet:signIn',()=>refresh().catch(()=>{}));
    connector.on('wallet:signOut',()=>{state.wallet=null;state.accountId=null;render()});
    await refresh();
  }catch(e){msg('Wallet connector unavailable. The live read-only NovaTech dashboard still works.',true)}
}
