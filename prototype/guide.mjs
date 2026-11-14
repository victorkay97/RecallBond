// Non-blocking help for prototype workspaces. Never grants authorization.
const body=document.body;
const role=body.classList.contains('business-v4')?'manufacturer':body.classList.contains('consumer-v4')?'consumer':null;
const host=document.querySelector('main.app-wrap');
if(role&&host) {
 const data=role==='manufacturer' ? [
  {name:'Understand your dashboard',description:'Overview reads the public testnet contract. Registered passports, active recalls and accepted claims are onchain figures, not fictional estimates.',tab:'overview'},
  {name:'Explore product passports',description:'Products shows NovaTech records. Issuing a real passport requires authorization by the registered issuer account in this prototype.',tab:'products'},
  {name:'Manage funded recalls',description:'Create a campaign for an eligible new batch, fund its full liability and activate it. Campaign #0 is already settled; never fund it twice.',tab:'recalls'},
  {name:'Review customer issues',description:'Customer claims currently demonstrates a browser-local review workflow. It is not yet a secure shared manufacturer inbox.',tab:'claims'},
  {name:'Inspect public receipts',description:'Activity & proof links to real testnet blockchain receipts. Visit the docs for details about future company accounts and embedded wallets.',tab:'analytics'}
 ] : [
  {name:'Explore your overview',description:'The portfolio includes clearly labeled sample devices and separately verified NEAR testnet information.',tab:'home'},
  {name:'Open your product passports',description:'My passports shows product records, QR previews and the ownership-transfer journey. Sample UI actions do not change the chain.',tab:'collection'},
  {name:'Report an issue',description:'Choose a product and report a defect to try the review experience. For now, reports are saved only in this browser.',tab:'collection'},
  {name:'Understand your wallet',description:'NEAR holds the real passport and compensation balances. The current demo needs wallet approval; future registration will link a wallet automatically.',tab:'wallet'},
  {name:'Check activities and public proof',description:'Activity includes a sample transaction journey. For independent onchain proof, open the public verifier and its real testnet transaction links.',tab:'activity'}
 ];
 const storageKey='recallbond:guide-dismissed:'+role;
 let dismissed=false;
 try{dismissed=localStorage.getItem(storageKey)==='yes'}catch{}
 const guide=document.createElement('section');
 guide.className='rb-guide';
 guide.setAttribute('aria-label','First-time workspace guide');
 guide.hidden=dismissed;
 guide.innerHTML=`<div class="rb-guide-overview"><div><strong>New to RecallBond? Start here.</strong><p>A five-step walkthrough of your ${role==='manufacturer'?'NovaTech workspace':'consumer app'}, including what is live on NEAR testnet.</p></div><div class="rb-guide-overview-actions"><button type="button" class="rb-guide-primary rb-guide-launch" aria-expanded="false">Take 5-step tour</button><button type="button" class="rb-guide-dismiss" aria-label="Dismiss getting started guide" title="Dismiss guide">×</button></div></div><div class="rb-guide-panel" hidden><span class="rb-guide-progress" aria-live="polite"></span><h2 class="rb-guide-title"></h2><p class="rb-guide-description"></p><div class="rb-guide-controls"><button type="button" class="rb-guide-back">Previous</button><button type="button" class="rb-guide-next rb-guide-primary">Next</button><button type="button" class="rb-guide-open">Open section</button><a href="../docs/">Help & documentation</a></div></div>`;
 const status=host.firstElementChild;
 if(status)status.insertAdjacentElement('afterend',guide);else host.prepend(guide);
 let index=0;
 const panel=guide.querySelector('.rb-guide-panel');
 const launcher=guide.querySelector('.rb-guide-launch');
 const back=guide.querySelector('.rb-guide-back');
 const next=guide.querySelector('.rb-guide-next');
 const render=()=>{
  const step=data[index];
  guide.querySelector('.rb-guide-progress').textContent='STEP '+(index+1)+' OF '+data.length;
  guide.querySelector('.rb-guide-title').textContent=step.name;
  guide.querySelector('.rb-guide-description').textContent=step.description;
  back.disabled=index===0;
  next.textContent=index===data.length-1?'Finish guide':'Next';
 };
 const close=()=>{
  guide.hidden=true;
  try{localStorage.setItem(storageKey,'yes')}catch{}
 };
 launcher.addEventListener('click',()=>{panel.hidden=!panel.hidden;launcher.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)render()});
 guide.querySelector('.rb-guide-dismiss').addEventListener('click',close);
 back.addEventListener('click',()=>{index=Math.max(0,index-1);render()});
 next.addEventListener('click',()=>{if(index===data.length-1){close();return}index++;render()});
 guide.querySelector('.rb-guide-open').addEventListener('click',()=>{
   const target=document.querySelector('nav [data-go="'+data[index].tab+'"]');
   if(target)target.click();
   if(window.matchMedia('(max-width: 700px)').matches)window.scrollTo({top:0,behavior:'smooth'});
 });
 const tooltips=role==='manufacturer'?{
  overview:'Your live onchain dashboard',products:'Product passports and issuance',recalls:'Funded recall campaigns',claims:'Customer defect reports (browser demo)',analytics:'Blockchain transaction receipts'
 }:{
  home:'Your product overview',collection:'Your product passports and issue reporting',wallet:'Your NEAR testnet wallet and compensation',activity:'Product and transaction activity'
 };
 document.querySelectorAll('nav [data-go]').forEach(button=>{const name=tooltips[button.dataset.go];if(name&&!button.title)button.title=name});
}