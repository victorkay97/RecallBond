/** Deterministic local reference simulation — NOT blockchain settlement. */
export class RecallBondLedger {
 constructor(){this.reset();}
 reset(){
  this.manufacturers=new Set(['novatech.testnet']);
  this.products=new Map();this.campaigns=new Map();this.claims=new Map();this.credits=new Map();this.events=[];this.nextCampaign=1;
  this.emit('System ready','Local simulation initialized');
 }
 emit(action,detail){this.events.unshift({action,detail,at:new Date().toISOString()});if(this.events.length>40)this.events.pop();}
 assert(value,message){if(!value)throw Error(message);}
 addProduct({id,batch,owner,issuer='novatech.testnet',model='NovaBook Air',serialHash='e'.repeat(64)}){
  this.assert(this.manufacturers.has(issuer),'Unregistered manufacturer');
  this.assert(!this.products.has(id),'Duplicate product');
  this.assert(![...this.campaigns.values()].some(c=>c.batch===batch),'Batch frozen');
  this.assert(/^[0-9a-f]{64}$/i.test(serialHash),'Invalid serial commitment');
  this.assert(![...this.products.values()].some(p=>p.issuer===issuer&&p.serialHash.toLowerCase()===serialHash.toLowerCase()),'Duplicate manufacturer serial');
  this.products.set(id,{id,batch,owner,issuer,model,serialHash});
  this.emit('Passport issued',id+' registered to '+owner);
 }
 transfer({id,from,to}){
  const p=this.products.get(id);this.assert(p,'Unknown passport');
  this.assert(p.owner===from,'Only current owner can transfer');this.assert(from!==to,'Cannot transfer to self');
  p.owner=to;this.emit('Ownership transferred',id+': '+from+' → '+to);
 }
 createCampaign({issuer='novatech.testnet',batch,payout,endsAt=Date.now()+86400000}){
  this.assert(Number.isSafeInteger(payout)&&payout>0,'Positive integer payout required');
  this.assert(endsAt>Date.now(),'Invalid expiry');
  const items=[...this.products.values()].filter(p=>p.batch===batch&&p.issuer===issuer);
  this.assert(items.length>0,'No products in batch');
  const id=this.nextCampaign++;
  const c={id,issuer,batch,payout,eligible:items.length,liability:payout*items.length,funded:0,active:false,closed:false,endsAt,claimedCount:0};
  this.assert(Number.isSafeInteger(c.liability),'Payout overflow');
  this.campaigns.set(id,c);this.emit('Campaign created',batch+' · '+items.length+' eligible units');return id;
 }
 fundCampaign({id,issuer='novatech.testnet',amount}){
  const c=this.getCampaign(id);this.assert(c.issuer===issuer,'Issuer only');
  this.assert(!c.active&&!c.closed,'Not accepting funding');
  this.assert(Number.isSafeInteger(amount)&&amount>0,'Invalid amount');
  this.assert(c.funded+amount<=c.liability,'Overfunded campaign');
  c.funded+=amount;this.emit('Reserve funded',amount+' demo mNEAR committed to #'+id);
 }
 activateCampaign(id){
  const c=this.getCampaign(id);this.assert(c.funded===c.liability,'Full reserve required');
  this.assert(!c.closed&&!c.active,'Already activated');this.assert(Date.now()<c.endsAt,'Campaign expired');
  c.active=true;this.emit('Recall activated','Campaign #'+id+' funded');
 }
 claim({id,token,caller}){
  const c=this.getCampaign(id),p=this.products.get(token),key=id+'|'+token;
  this.assert(c.active&&!c.closed,'Inactive campaign');this.assert(Date.now()<=c.endsAt,'Campaign expired');
  this.assert(p&&p.batch===c.batch&&p.issuer===c.issuer,'Product not eligible');
  this.assert(p.owner===caller,'Only the current passport holder can claim');
  this.assert(!this.claims.has(key),'Compensation already claimed');
  this.assert(c.funded>=c.payout,'Insufficient reserve');
  this.claims.set(key,caller);c.funded-=c.payout;c.claimedCount++;
  this.credits.set(caller,(this.credits.get(caller)||0)+c.payout);
  this.emit('Compensation approved',caller+' earned '+c.payout+' demo mNEAR');
 }
 withdraw(caller){
  const value=this.credits.get(caller)||0;this.assert(value>0,'Nothing to withdraw');
  this.credits.delete(caller);this.emit('Demo withdrawal',caller+' withdrew '+value+' simulated mNEAR');return value;
 }
 closeCampaign(id){
  const c=this.getCampaign(id);this.assert(!c.closed&&Date.now()>c.endsAt,'Campaign not expired');
  c.closed=true;this.credits.set(c.issuer,(this.credits.get(c.issuer)||0)+c.funded);c.funded=0;
 }
 getCampaign(id){const c=this.campaigns.get(id);this.assert(c,'Unknown campaign');return c;}
}
