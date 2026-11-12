// RecallBond business v2: read-only chain-backed dashboard. No keys, signatures, or fake balances.
import { viewCall } from '../verify/testnet-rpc.mjs';
const CONTRACT = 'rb-vk97-261112.testnet';
const ISSUER = 'novatech-vk97-261112.testnet';
const CAMPAIGN_ID = 0;
const MAX_PAGE = 100;
const $ = id => document.getElementById(id);
const setText = (id, value) => { const el=$(id); if(el) {el.textContent=String(value);el.classList.remove('rb-skeleton');} };
const near = v => {
  const n=BigInt(v), divider=10n**24n;
  const whole=n/divider;
  const decimal=((n%divider)*1000n/divider).toString().padStart(3,'0').replace(/0+$/,'');
  return whole.toString()+(decimal?'.'+decimal:'')+' NEAR';
};
function showError(label) {
  setText('live-rpc-status','Connection unavailable · latest records could not be verified.');
  for(const id of ['live-passport-count','live-active-count','live-claim-count',
    'live-eligible','live-liability','live-reserve','recall-eligible','recall-payout',
    'recall-liability','insights-passport-count','insights-claim-count']) {
    if($(id)?.textContent.trim()==='—') setText(id,'—');
  }
  if(label==='passports'){
    for(const id of ['live-recent-products','live-all-products']){
      const node=$(id);if(node){node.classList.remove('rb-skeleton');node.replaceChildren(message('Passport records are temporarily unavailable. Please retry or use Public Verify.'));}
    }
  }
}
function message(text){const p=document.createElement('p');p.className='small muted';p.textContent=text;return p}
function makeRow(token,product){
  const row=document.createElement('div');row.className='item-row';
  const icon=document.createElement('span');icon.className='mini-passport';
  const glyph=document.createElement('span');glyph.setAttribute('aria-hidden','true');
  glyph.innerHTML='<svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24"><path d="M4 7 12 3l8 4v10l-8 4-8-4V7M4 7l8 4 8-4m-8 4v10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';glyph.style.cssText='display:grid;place-items:center;color:#b8eac8';
  icon.append(glyph);
  const info=document.createElement('div');info.className='grow';
  const title=document.createElement('b');title.textContent=token.metadata?.title||'Product passport';
  const sub=document.createElement('small');sub.textContent=token.token_id+' · '+product.batch_id;
  info.append(title,sub);
  const link=document.createElement('a');link.className='btn white';
  link.href='../verify/?id='+encodeURIComponent(token.token_id);
  link.innerHTML='Verify <svg class="rg-icon" aria-hidden="true"><use href="../assets/mingcute.svg#arrow-up-right"/></svg>';link.setAttribute('aria-label','Verify onchain passport '+token.token_id);
  row.append(icon,info,link);return row;
}
async function showProducts(){
  // The contract exposes standard NEP-171 enumeration, paged for predictable reads.
  // Demo operator minted one token; later accounts can create more.
  const all=[];
  for(let start=0; start<500; start+=MAX_PAGE) {
    const result=await viewCall({contractId:CONTRACT,method:'nft_tokens',args:{from_index:String(start),limit:MAX_PAGE}});
    if(!Array.isArray(result.value)) throw new Error('Expected NFT enumeration list');
    all.push(...result.value);
    if(result.value.length<MAX_PAGE)break;
  }
  const detailed=await Promise.all(all.map(async token=>{
    const p=await viewCall({contractId:CONTRACT,method:'get_product',args:{token_id:token.token_id}});
    return {token,product:p.value};
  }));
  const owned=detailed.filter(x=>x.product?.manufacturer===ISSUER);
  setText('live-passport-count',owned.length);
  setText('insights-passport-count',owned.length);
  setText('live-passport-sub','Verified NovaTech issuer · testnet');
  const full=$('live-all-products'),recent=$('live-recent-products');
  if(full){full.classList.remove('rb-skeleton');full.replaceChildren(...(owned.length?owned.map(({token,product})=>makeRow(token,product)):[message('No registered NovaTech passports onchain yet.')]))}
  if(recent){recent.classList.remove('rb-skeleton');recent.replaceChildren(...(owned.length?owned.slice(0,3).map(({token,product})=>makeRow(token,product)):[message('No registered passports yet.')]))}
  return owned.length;
}
async function showCampaign(){
  const {value:c,blockHeight}=await viewCall({contractId:CONTRACT,method:'get_campaign',args:{id:CAMPAIGN_ID}});
  if(!c || c.manufacturer!==ISSUER || c.batch_id!=='BATTERY-X21')throw new Error('Unexpected issuer or batch');
  const active=Boolean(c.activated&&!c.closed);
  setText('live-active-count',active?1:0);
  setText('live-claim-count',c.claimed_count);
  setText('insights-claim-count',c.claimed_count);
  setText('live-eligible',c.eligible_count);
  setText('live-liability',near(c.max_liability_yocto));
  setText('live-reserve',near(c.funded_yocto));
  setText('recall-eligible',c.eligible_count);
  setText('recall-payout',near(c.payout_yocto));
  setText('recall-liability',near(c.max_liability_yocto));
  setText('live-campaign-state',active?'Active · Onchain':c.closed?'Closed':'Not active');
  setText('live-status-pill',active?'Active':'Not active');
  setText('recall-live-status',active?'Active · Onchain':c.closed?'Closed':'Not active');
  setText('insights-rpc-status','Connected');
  setText('live-rpc-status','Contract '+CONTRACT+' · finalized block '+blockHeight);
}
const results=await Promise.allSettled([showProducts(),showCampaign()]);
if(results.some(r=>r.status==='rejected')){
  for(const r of results) if(r.status==='rejected') console.warn('RecallBond live read unavailable:',r.reason instanceof Error?r.reason.message:'Unknown error');
  if(results[0].status==='rejected')showError('passports');
  if(results[1].status==='rejected')showError('campaign');
}
// Never overwrite a successfully verified count with demo/sample numbers.
