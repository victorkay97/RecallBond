// RecallBond authenticated workspace. No client-managed private keys or fake payments.
// Signed transactions happen in the server using only the user's linked active testnet identity.
const $=id=>document.getElementById(id),alertBox=$('st-alert');
let me=null,refreshing=false;
const endpoint=(path,action)=>'../api/'+path+'?action='+encodeURIComponent(action);
async function api(path,action,body){
 const opt={method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',
  headers:{Accept:'application/json'}};
 if(body!==undefined){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body);}
 const response=await fetch(endpoint(path,action),opt),result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(result.error||result.reason||'Request failed');
 return result;
}
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
function icon(name){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS('http://www.w3.org/2000/svg','use');
 use.setAttribute('href','../assets/mingcute.svg#'+name);svg.append(use);return svg;
}
function empty(msg){return el('div','st-empty',msg);}
function near(yocto){
 const v=BigInt(String(yocto??'0')),whole=v/1000000000000000000000000n;
 const fraction=(v%1000000000000000000000000n).toString().padStart(24,'0').slice(0,6).replace(/0+$/,'');
 return whole.toString()+(fraction?'.'+fraction:'')+' NEAR';
}
function message(msg,error=false,hash){
 alertBox.replaceChildren(el('span','',msg));alertBox.classList.toggle('error',error);
 if(hash&&/^[a-zA-Z0-9]{40,50}$/.test(hash)){
  const link=el('a','',' · View testnet receipt');link.href='https://explorer.testnet.near.org/transactions/'+hash;
  link.target='_blank';link.rel='noopener noreferrer';alertBox.append(link);
 }
}
function line(title,detail,meta,buttons=[]){
 const card=el('article','st-item'),info=el('div');info.append(el('strong','',title));
 if(detail)info.append(el('small','',detail));if(meta)info.append(el('div','st-item-meta',meta));
 const aside=el('aside');for(const b of buttons)aside.append(b);
 card.append(info,aside);return card;
}
function chip(txt,wait=false){return el('span','st-tag'+(wait?' wait':''),txt);}
function button(label,fn){
 const b=el('button','',label);b.type='button';
 b.addEventListener('click',async()=>{if(b.disabled)return;b.disabled=true;try{await fn();}catch(e){message(e.message,true);}finally{b.disabled=false;}});
 return b;
}
async function act(action,body,confirmText){
 if(confirmText&&!confirm(confirmText))return null;
 message('Signing a real NEAR testnet transaction…');
 const out=await api('chain',action,body);
 message(out.notice||'Onchain transaction submitted successfully.',false,out.txHash);
 await refresh(false);
 return out;
}
function requireReady(){
 if(!me?.emailVerified)throw Error('Verify your email before signing blockchain actions');
 if(me.wallet?.status!=='active')throw Error('Your NEAR wallet needs testnet activation');
}
const panel=(id,items,msg)=>{const root=$(id);root.replaceChildren();if(!items.length)root.append(empty(msg));else root.append(...items);};
function renderConsumer(data,issues){
 const owned=data.products||[],recalls=data.recalls||[];
 $('consumer-count').textContent=owned.length+' owned';
 $('consumer-credits').textContent=near(data.creditYocto)+' credit';
 $('consumer-withdraw').disabled=BigInt(String(data.creditYocto||'0'))===0n;
 panel('consumer-passports',owned.map(p=>{
  const btn=button('Verify',()=>{window.open('../verify/?id='+encodeURIComponent(p.token_id),'_blank','noopener');});
  return line(p.title||p.token_id,'Batch '+p.batch_id+' · Owned by your verified NEAR address',p.token_id,[chip('Onchain'),btn]);
 }), 'No onchain passports yet. Ask a verified manufacturer to mint a product to your registered email.');
 panel('consumer-recalls',recalls.map(r=>{
  const c=r.campaign;
  const permitted=Boolean(c?.activated&&!c?.closed&&!r.claimant&&BigInt(c?.funded_yocto||'0')>=BigInt(c?.payout_yocto||'0'));
  const btn=permitted?button('Claim '+near(c.payout_yocto),()=>{requireReady();return act('claim',{campaignId:Number(c.id),tokenId:r.tokenId},
    'Claim this recalled device compensation on NEAR testnet? This can only be done once.');}):chip(r.claimant?'Already claimed':c?.activated?'Not currently claimable':'Pending funding',true);
  return line('Campaign #'+c.id+' · '+r.tokenId,
   'Affected batch '+c.batch_id+' · '+near(c.payout_yocto)+' per product',
   'Issuer '+c.manufacturer,[btn]);
 }), 'No recall campaigns affect your currently owned passports.');
 panel('consumer-issues',(issues||[]).map(x=>line(x.token_id,x.category+' · '+x.description,x.created_at,[chip(x.status,true)])),
  'No support reports saved for your account.');
}
function renderManufacturer(data){
 $('manufacturer-count').textContent=data.products.length+' products';
 panel('manufacturer-products',data.products.map(p=>{
  const link=el('a','','Verify passport');link.href='../verify/?id='+encodeURIComponent(p.token_id);
  link.target='_blank';link.rel='noopener noreferrer';
  return line(p.title,'Batch '+p.batch_id+' · '+p.status,p.token_id,[chip(p.status,p.status!=='confirmed'),link]);
 }), 'No minted products yet. The signed mint form will populate this collection.');
 panel('manufacturer-campaigns',data.campaigns.map(entry=>{
  const c=entry.onchain;
  if(!c)return line('Campaign #'+entry.campaign_id,'Unable to read contract state',entry.batch_id,[chip('Check chain',true)]);
  const actions=[];
  const max=BigInt(c.max_liability_yocto||'0'),funded=BigInt(c.funded_yocto||'0');
  if(!c.activated&&!c.closed&&max>funded)
   actions.push(button('Fund '+near(max-funded),()=>{requireReady();return act('fund_campaign',{campaignId:Number(c.id)},
    'Transfer '+near(max-funded)+' from your company testnet wallet to the recall reserve?');}));
  if(!c.activated&&!c.closed&&max===funded)
   actions.push(button('Activate recall',()=>{requireReady();return act('activate_campaign',{campaignId:Number(c.id)},
    'Make this fully funded recall available to eligible owners?');}));
  actions.push(chip(c.closed?'Closed':c.activated?'Active':'Draft / unfunded',!c.activated));
  return line('Campaign #'+c.id+' · '+c.batch_id,'Reserved: '+near(c.funded_yocto)+' of '+near(c.max_liability_yocto),
    'Eligible devices '+c.eligible_count+' · Claimed '+c.claimed_count,actions);
 }), 'No recall campaigns yet. Create a campaign for a minted production batch.');
 panel('manufacturer-issues',(data.issues||[]).map(x=>{
  const select=el('select','');
  for(const value of ['submitted','under_review','more_info','approved_repair','approved_replacement','declined']){
   const opt=el('option','',value.replace(/_/g,' '));opt.value=value;opt.selected=value===x.status;select.append(opt);
  }
  const save=button('Save review',()=>act('review_issue',{id:x.id,status:select.value},
    'Save this support decision? It will not transfer any funds.'));
  return line(x.token_id+' · '+x.category,x.description,'Status '+x.status,[select,save]);
 }), 'No verified customer issues routed to your company.');
}
async function refresh(withMessage=true){
 if(refreshing)return;refreshing=true;
 try{
  if(withMessage)message('Loading authenticated account…');
  const session=await api('auth','me');me=session.user;
  $('st-user-email').textContent=me.email;
  $('st-wallet-id').textContent=me.wallet?.accountId||'No wallet';
  $('st-wallet-status').textContent=(me.wallet?.status||'No status')+' · '+(me.emailVerified?'email verified':'email unverified');
  const isCompany=me.role==='manufacturer';
  $('st-consumer').hidden=isCompany;$('st-manufacturer').hidden=!isCompany;
  $('st-greeting').replaceChildren(document.createTextNode(isCompany?'Build protection for':'Everything you own,'),document.createElement('br'),el('em','',isCompany?'the products you make.':'all in one place.'));
  $('st-summary').textContent=isCompany?'Company: '+(me.organization?.name||'Not registered')+' · '+(me.organization?.status||'Unverified')+' · All transactions run on NEAR testnet.':
   'Your passport collection, recall eligibility, claims, credits and support reports — backed by real testnet state.';
  if(!me.emailVerified){message('Email verification is required for signed actions. Configure ZeptoMail and verify your address from Account settings.',true);return;}
  if(me.wallet?.status!=='active'){message('Your linked NEAR wallet is reserved. Activate it from Account settings when sponsor funding is enabled.',true);return;}
  if(isCompany){
   if(me.organization?.status!=='verified'){message('Organization verification is pending; the administrator must approve your company before manufacturer actions.',true);return;}
   try{const d=await api('chain','manufacturer');renderManufacturer(d);
     if(withMessage)message('Live company records loaded. NEAR issuer authorization is checked by the contract.');
   }catch(e){message(e.message,true);}
  }else{
   try{const [portfolio,reports]=await Promise.all([api('chain','portfolio'),api('auth','issues')]);
     renderConsumer(portfolio,reports.issues);if(withMessage)message('Live blockchain ownership and recall data verified.');
   }catch(e){message(e.message,true);}
  }
 }catch(e){
  message('Sign in to see your private onchain workspace. '+e.message,true);
  const link=el('a','',' Open registration / sign-in');link.href='../account/';alertBox.append(link);
 }finally{refreshing=false;}
}
function formSubmit(id,action,build,confirmText){
 const form=$(id);form.addEventListener('submit',async e=>{
  e.preventDefault();
  const button=form.querySelector('button[type=submit]');button.disabled=true;
  try{requireReady();const payload=build(new FormData(form));const result=await act(action,payload,confirmText);if(result)form.reset();}
  catch(err){message(err.message,true);}finally{button.disabled=false;}
 });
}
formSubmit('consumer-transfer','transfer',f=>({tokenId:String(f.get('tokenId')||'').trim(),recipientEmail:String(f.get('recipientEmail')||'').trim()}),
 'Transfer this NFT to the recipient? The blockchain will immediately change legal control of the token, not of the physical item.');
formSubmit('manufacturer-mint','mint',f=>({title:String(f.get('title')||'').trim(),batchId:String(f.get('batchId')||'').trim(),
 serial:String(f.get('serial')||'').trim(),ownerEmail:String(f.get('ownerEmail')||'').trim()}),
 'Mint a unique transferable passport to this consumer wallet on NEAR testnet? A storage deposit will be attached and unused storage refunded.');
formSubmit('manufacturer-campaign','create_campaign',f=>({batchId:String(f.get('batchId')||'').trim(),payoutNear:String(f.get('payoutNear')||''),
 expiryDays:Number(f.get('expiryDays'))}),
 'Creating this batch recall freezes further passport issuance in the batch. You must fund the full liability before it becomes active. Continue?');
// Issue reports use the persistent ownership-verified backend, not a simulated blockchain call.
$('consumer-issue').addEventListener('submit',async e=>{
 e.preventDefault();const form=e.currentTarget,btn=form.querySelector('button[type=submit]');btn.disabled=true;
 try{if(!me?.emailVerified)throw Error('Verify your email first');const f=new FormData(form);
  const data=await api('auth','issues',{tokenId:String(f.get('tokenId')||'').trim().toUpperCase(),
   category:String(f.get('category')||''),description:String(f.get('description')||'').trim()});
  message(data.notice||'Issue saved to database.');form.reset();await refresh(false);
 }catch(err){message(err.message,true);}finally{btn.disabled=false;}
});
$('consumer-withdraw').addEventListener('click',async()=>{
 const b=$('consumer-withdraw');b.disabled=true;
 try{requireReady();await act('withdraw',{},'Withdraw your approved recall credit to your linked NEAR testnet account?');}
 catch(e){message(e.message,true);}finally{b.disabled=false;}
});
$('st-refresh').addEventListener('click',()=>refresh());
document.querySelectorAll('[data-nav]').forEach(link=>link.addEventListener('click',e=>{
 e.preventDefault();
 const section=link.dataset.nav;
 const scope=me?.role==='manufacturer'?'#st-manufacturer':'#st-consumer';
 const target=section==='overview'?document.getElementById('overview'):document.querySelector(scope+' [data-section="'+section+'"]');
 if(target&&!target.hidden)target.scrollIntoView({behavior:'smooth',block:'start'});
 history.replaceState(null,'','#'+section);
 document.querySelectorAll('[data-nav]').forEach(x=>x.removeAttribute('aria-current'));link.setAttribute('aria-current','page');
}));
refresh();
