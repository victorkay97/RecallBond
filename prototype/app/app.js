// RecallBond interactive consumer concept.
// This file intentionally does NOT connect to NEAR or provision an actual wallet.
// Do not treat any local simulation as a transaction receipt or spendable funds.
const byId = id => document.getElementById(id);
const icons = Object.freeze({
  shield: '<svg class="icon" aria-hidden="true"><use href="../assets/mingcute.svg#shield"/></svg>',
  arrow: '<svg class="icon" aria-hidden="true"><use href="../assets/mingcute.svg#arrow-right"/></svg>',
  lock: '<svg class="icon" aria-hidden="true"><use href="../assets/mingcute.svg#shield"/></svg>',
  gem: '<svg class="icon" aria-hidden="true"><use href="../assets/mingcute.svg#diamond"/></svg>',
});
const products = Object.freeze({
  'RB-NV-002891': { name: 'NovaBook Air', issuer: 'NovaTech', batch: 'BATTERY-X21', coverage: 'Active', protected: true },
  'RB-NV-002892': { name: 'NovaPhone S2', issuer: 'NovaTech', batch: 'PHONE-2026-A', coverage: 'Active', protected: true },
});
const state = { selected: 'RB-NV-002891', view: 'home', credited: 0, claimed: false, archived: new Set(), activity: [] };
let lastFocus = null, toastTimeout = null;

const announce = message => {
  const toast=byId('toast');
  toast.textContent=message; toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout=setTimeout(()=>toast.classList.remove('show'),4500);
};
const qrURL = id => new URL('../verify/?id='+encodeURIComponent(id),location.href).toString();

function renderQRs(){
  for(const stage of document.querySelectorAll('[data-passport]')){
    const id=stage.dataset.passport;
    const target=stage.querySelector('[data-qr]');
    if(!target)continue;
    if(typeof window.qrcode !== 'function'){
      const link=document.createElement('a');
      link.href=qrURL(id);
      link.textContent='Open public verification';
      link.style.cssText='font-size:12px;text-align:center;text-decoration:underline;color:#1a5c49';
      target.replaceChildren(link);
      continue;
    }
    try{
      const qr=window.qrcode(0,'H');
      qr.addData(qrURL(id));
      qr.make();
      // Local SVG generation, no 3rd party QR API. Keep the QR unobstructed.
      target.innerHTML=qr.createSvgTag({cellSize:5,margin:4,scalable:true,
        title:{text:'Verification code for '+id}});
    }catch(error){console.warn('QR generation failed',error);target.textContent='QR preview unavailable';}
    const button=stage.querySelector('.passport-button');
    button?.addEventListener('click',()=>{
      const flipped=button.classList.toggle('is-flipped');
      button.setAttribute('aria-pressed',String(flipped));
      button.setAttribute('aria-label',flipped?'Show '+(products[id]?.name??'product')+' passport front':'Flip '+(products[id]?.name??'product')+' passport to show its QR');
      setSelected(id);
    });
  }
}

function setSelected(id){
  if(!products[id])return;
  state.selected=id;
  const model=byId('selected-model'),idSpan=byId('selected-id'),verify=byId('selected-verify');
  if(model)model.textContent=products[id].name;
  if(idSpan)idSpan.textContent=id;
  if(verify)verify.href='../verify/?id='+encodeURIComponent(id);
}

function navigate(view,{updateHash=true}={}){
  if(!['home','collection','wallet','activity'].includes(view))view='home';
  state.view=view;
  document.querySelectorAll('.screen').forEach(el=>el.hidden=el.id!=='screen-'+view);
  document.querySelectorAll('[data-go]').forEach(el=>{
    const active=el.dataset.go===view;
    el.classList.toggle('active',active);
    if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
  });
  if(updateHash)history.replaceState(null,'','#'+view);
  window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}

function updateCredits(){
  const n=state.credited;
  const stat=byId('stat-credit');
  if(stat)stat.textContent=String(n);
  const box=byId('wallet-credit');
  if(box)box.innerHTML=n+' <span style="font-size:13px;color:#91a29a">demo mNEAR</span>';
}
function addActivity(title,detail){
  state.activity.unshift({title,detail});
  const timeline=byId('timeline');
  if(!timeline)return;
  const row=document.createElement('div');
  row.className='item-row';
  const bubble=document.createElement('span');
  bubble.className='i-bubble';
  bubble.innerHTML=icons.gem;
  const body=document.createElement('div');
  body.className='grow';
  const strong=document.createElement('b');strong.textContent=title;
  const small=document.createElement('small');small.textContent=detail+' · Local demo only';
  body.append(strong,small);
  const badge=document.createElement('span');badge.className='status-pill neutral';badge.textContent='Preview';
  row.append(bubble,body,badge);
  timeline.prepend(row);
}

function modalTemplate(kind){
  const item=products[state.selected];
  switch(kind){
    case 'claim':
      return {
        eyebrow:'RECALL PROTECTION',
        title:state.claimed?'Example claim approved':'Battery recall benefit',
        sub:'See what an affected registered product holder would experience when a recall campaign is funded.',
        body:`<div class="item-row"><div><b>Eligible passport</b><small>NovaBook Air · Batch X21</small></div><span class="status-pill">Eligible · Demo</span></div>
          <div class="item-row"><div><b>Possible compensation</b><small>Fictional campaign · not real money</small></div><span class="value">100 demo mNEAR</span></div>
          <div class="item-row"><div><b>Contract-held credit</b><small>Not your spendable wallet balance</small></div><span class="value">${state.credited} demo mNEAR</span></div>
          <p class="notice warn" style="margin-top:17px">This is a visual simulation of a user-initiated claim. No signature is requested and nothing is sent to NEAR.</p>
          <div class="dialog-actions"><button class="btn soft" type="button" data-close>Close</button><button class="btn primary" type="button" id="simulate-claim" ${state.claimed?'disabled':''}>${state.claimed?'Demo already claimed':'Simulate claim'}</button></div>`
      };
    case 'transfer':
      return {
        eyebrow:'PRODUCT OWNERSHIP',
        title:'Transfer your passport',
        sub:'A registered transfer would move unclaimed protection rights to the next holder. In the real app, you would sign this on NEAR.',
        body:`<div class="item-row"><div><b>Selected passport</b><small>Manufacturer registered product</small></div><span class="value">${item.name}</span></div>
          <form id="transfer-form">
            <div class="form-field" style="margin-top:16px"><label for="recipient">Recipient RecallBond ID / NEAR account</label><input id="recipient" name="recipient" placeholder="e.g. emmanuel.testnet" autocomplete="off" minlength="4" maxlength="90" required></div>
            <p class="notice warn">Double-check the recipient. A completed NFT transfer changes who can claim unclaimed benefits. No transfer will take place in this preview.</p>
            <div class="dialog-actions"><button type="button" class="btn soft" data-close>Cancel</button><button type="submit" class="btn primary">Review transfer ${icons.arrow}</button></div>
          </form>`
      };
    case 'add':
      return {
        eyebrow:'YOUR PRODUCT COLLECTION',
        title:'Add a product',
        sub:'Scan a manufacturer passport or enter its ID. The QR only locates the record; a separate activation credential will be required to prove first ownership.',
        body:`<form id="add-form"><div class="form-field"><label for="passport-id">Product passport ID</label><input id="passport-id" name="passport" placeholder="RB-NV-002891" required maxlength="64"></div>
        <p class="notice">This is an interaction preview. You cannot claim ownership simply by guessing or scanning a product ID.</p>
        <div class="dialog-actions"><button type="button" class="btn soft" data-close>Cancel</button><button type="submit" class="btn primary">Look up passport</button></div></form>`
      };
    case 'wallet':
      return {
        eyebrow:'WALLET & SIGNING',
        title:'Your NEAR account',
        sub:'RecallBond is designed to provision or link a NEAR account after secure onboarding.',
        body:`<div class="item-row"><div><b>Wallet connection</b><small>Embedded or existing wallet planned</small></div><span class="status-pill gold">Not connected</span></div>
        <div class="item-row"><div><b>Spendable wallet balance</b><small>Not available in design preview</small></div><span class="value">— NEAR</span></div>
        <div class="item-row"><div><b>Claim credit (inside contract)</b><small>Simulation only</small></div><span class="value">${state.credited} demo mNEAR</span></div>
        <p class="notice warn" style="margin-top:16px">No wallet was created, no private key is stored here, and no real transactions occur.</p>
        <div class="dialog-actions"><button class="btn primary" data-close>Got it</button></div>`
      };
    case 'withdraw':
      return {
        eyebrow:'COMPENSATION SETTLEMENT',
        title:'Withdraw your compensation',
        sub:'Approved claims are first held in the RecallBond contract. A real wallet withdrawal transfers the credit to your NEAR account.',
        body:`<div class="item-row"><div><b>Example contract credit</b><small>Available to simulate only</small></div><span class="value">${state.credited} demo mNEAR</span></div>
        <div class="item-row"><div><b>Spendable NEAR wallet funds</b><small>No connected wallet</small></div><span class="value">—</span></div>
        <p class="notice warn" style="margin-top:17px">Withdrawals cannot be executed here. The deployed contract requires an authenticated wallet transaction and confirmed payout callback.</p>
        <div class="dialog-actions"><button class="btn primary" data-close>Understood</button></div>`
      };
    case 'archive':
      return {
        eyebrow:'COLLECTION ORGANIZATION',
        title:'Archive this passport?',
        sub:'Archiving only hides the card from your usual collection. It will not delete an NFT, change the owner, or forfeit the associated claim rights.',
        body:`<div class="item-row"><div><b>Selected passport</b><small>Original ownership is unchanged</small></div><span class="value">${item.name}</span></div>
          <p class="notice" style="margin-top:15px">To transfer product ownership, use the separate transfer process. Removing personal records has a different privacy workflow.</p>
          <div class="dialog-actions"><button class="btn soft" data-close>Cancel</button><button class="btn primary" id="archive-preview">Archive in preview</button></div>`
      };
    case 'notifications':
      return {
        eyebrow:'NOTIFICATIONS',
        title:'Your protection alerts',
        sub:'Important product updates should feel clear and timely, not overwhelming.',
        body:`<div class="item-row"><span class="i-bubble amber">${icons.shield}</span><div class="grow"><b>Battery recall program available</b><small>NovaBook Air · fictional program · example notification</small></div></div>
          <div class="item-row"><span class="i-bubble">${icons.gem}</span><div class="grow"><b>Collection ready</b><small>Two example passports in your demo collection.</small></div></div>
          <p class="notice">Live notification delivery has not been implemented yet.</p>
          <div class="dialog-actions"><button class="btn primary" data-close>Done</button></div>`
      };
    case 'account':
      return {
        eyebrow:'ACCOUNT PROFILE',
        title:'Tomi’s RecallBond',
        sub:'Secure, familiar account access with embedded NEAR wallet provisioning is part of the product plan.',
        body:`<div class="item-row"><div><b>Account status</b><small>Fictional example profile</small></div><span class="status-pill gold">Preview only</span></div>
          <div class="item-row"><div><b>Wallet authentication</b><small>Email/passkey or existing NEAR wallet planned</small></div><span class="value">Not connected</span></div>
          <div class="item-row"><div><b>Consumer data</b><small>Will not be included in public QR verification</small></div><span class="status-pill">Private</span></div>
          <div class="dialog-actions"><a class="btn soft" href="../verify/">Public verifier</a><button class="btn primary" data-close>Close</button></div>`
      };
    default:return {eyebrow:'RECALLBOND',title:'Not available yet',sub:'This is a design preview.',body:'<button class="btn primary" data-close>Close</button>'};
  }
}
function closeModal(){
  const layer=byId('dialog-layer');
  if(layer.hidden)return;
  layer.hidden=true;
  byId('dialog').replaceChildren();
  document.body.style.overflow='';
  if(lastFocus && document.contains(lastFocus))lastFocus.focus();
}
function openModal(kind){
  const layer=byId('dialog-layer'),dialog=byId('dialog');
  lastFocus=document.activeElement;
  const info=modalTemplate(kind);
  dialog.innerHTML=`<div class="dialog-head"><div><span class="eyebrow">${info.eyebrow}</span><h2 id="dialog-title">${info.title}</h2></div><button class="dialog-close" aria-label="Close dialog" data-close>×</button></div><p>${info.sub}</p>${info.body}`;
  layer.hidden=false;
  document.body.style.overflow='hidden';
  dialog.querySelector('[data-close]')?.focus();
  dialog.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',closeModal));
  bindModalActions();
}
function bindModalActions(){
  byId('simulate-claim')?.addEventListener('click',()=>{
    if(state.claimed)return;
    state.claimed=true;state.credited=100;updateCredits();closeModal();
    addActivity('Example compensation claim approved','100 demo mNEAR credited to a simulated contract balance');
    announce('Demo claim approved · 100 demo mNEAR credited inside the example contract, not your wallet.');
  });
  byId('add-form')?.addEventListener('submit',event=>{
    event.preventDefault();
    const input=byId('passport-id').value.trim().toUpperCase();
    closeModal();
    if(!products[input])return announce('No matching example passport. Real product activation requires manufacturer approval.');
    navigate('collection');
    setSelected(input);
    announce('Example passport located. The QR alone does not authorize you to claim ownership.');
  });
  byId('transfer-form')?.addEventListener('submit',event=>{
    event.preventDefault();
    const dest=byId('recipient').value.trim().toLowerCase();
    if(!/^[a-z0-9][a-z0-9._-]{2,88}$/.test(dest))return announce('Enter a valid RecallBond ID or NEAR-style account identifier.');
    closeModal();
    // Deliberately do not move the example NFT in the UI.
    announce('Preview only: you reviewed '+dest+'. No NFT was transferred; live transfers require wallet approval.');
  });
  byId('archive-preview')?.addEventListener('click',()=>{
    state.archived.add(state.selected);
    closeModal();
    announce('Archived in the preview only. The NFT remains owned by the same account.');
  });
}
document.addEventListener('click',event=>{
  const target=event.target.closest('[data-go],[data-modal],[data-open]');
  if(!target)return;
  if(target.dataset.go)navigate(target.dataset.go);
  else if(target.dataset.modal)openModal(target.dataset.modal);
  else if(target.dataset.open==='claim')openModal('claim');
});
byId('dialog-layer').addEventListener('click',e=>{if(e.target===byId('dialog-layer'))closeModal();});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!byId('dialog-layer').hidden)closeModal();
  if(e.key==='Tab'&&!byId('dialog-layer').hidden){
    const focusables=[...byId('dialog').querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled])')].filter(el=>el.offsetParent!==null);
    if(focusables.length){
      const first=focusables[0],last=focusables.at(-1);
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }
  }
});
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)||'home',{updateHash:false}));
renderQRs();
updateCredits();
navigate(location.hash.slice(1)||'home',{updateHash:false});
