const $=id=>document.getElementById(id);
const form=$('account-form'),submit=$('account-submit'),feedback=$('account-feedback'),
  company=$('company-field'),role=$('account-role'),password=$('account-password');
let mode='signup',ready=false,working=false;
const setMessage=(msg,ok=false)=>{feedback.textContent=msg;feedback.classList.toggle('success',ok)};
async function api(action,{method='GET',body}={}){
  const response=await fetch('../api/auth?action='+encodeURIComponent(action),{
    method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},
    body:body?JSON.stringify(body):undefined,cache:'no-store'
  });
  let data;try{data=await response.json()}catch{throw Error('The account service returned an invalid response');}
  if(!response.ok)throw Error(data.error||data.reason||'Account request failed');
  return data;
}
function renderMode(){
  const signup=mode==='signup';
  $('form-heading').textContent=signup?'Create an account':'Sign in';
  $('form-subtitle').textContent=signup?'Get started with RecallBond in a few steps.':'Welcome back. Access your saved account.';
  $('role-field').hidden=!signup;
  $('phone-field').hidden=!signup;
  $('account-phone').required=signup;
  company.hidden=!(signup&&role.value==='manufacturer');
  $('account-company').required=!company.hidden;
  password.autocomplete=signup?'new-password':'current-password';
  password.minLength=signup?12:1;
  $('password-hint').hidden=!signup;
  submit.firstChild.textContent=signup?'Create account ':'Sign in ';
  document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
  setMessage(''); 
}
async function loadIssues(){
  const list=$('issue-list');
  list.replaceChildren();
  try{
    const data=await api('issues');
    if(!Array.isArray(data.issues)||data.issues.length===0){
      const empty=document.createElement('p');
      empty.textContent='No issue reports saved yet.';
      list.append(empty);
      return;
    }
    for(const issue of data.issues){
      const el=document.createElement('article');
      el.className='rb-account-issue';
      const header=document.createElement('header');
      const product=document.createElement('strong');product.textContent=issue.token_id;
      const status=document.createElement('span');status.textContent=issue.status;
      header.append(product,status);
      const text=document.createElement('p');text.textContent=issue.description;
      el.append(header,text);list.append(el);
    }
  }catch(e){
    const msg=document.createElement('p');msg.textContent='Could not load saved reports: '+e.message;list.append(msg);
  }
}
$('issue-form').addEventListener('submit',async(event)=>{
  event.preventDefault();
  const button=$('issue-submit');button.disabled=true;
  $('issue-feedback').textContent='';
  const data=new FormData(event.currentTarget);
  try{
    const result=await api('issues',{method:'POST',body:{
      tokenId:String(data.get('tokenId')||''),
      category:String(data.get('category')||''),
      description:String(data.get('description')||'')
    }});
    $('issue-feedback').textContent='Issue saved (#'+result.id.slice(0,8)+'). Ownership review is still pending.';
    $('issue-description').value='';
    await loadIssues();
  }catch(e){$('issue-feedback').textContent=e.message;}
  finally{button.disabled=false;}
});
async function emailAction(action,body={}) {
  const response=await fetch('../api/email?action='+encodeURIComponent(action),{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(result.error||'Email verification unavailable');
  return result;
}
$('verify-send').addEventListener('click',async()=>{
 const btn=$('verify-send');btn.disabled=true;
 $('verify-feedback').textContent='Sending a one-time verification code…';
 try{
  await emailAction('request');
  $('verify-form').hidden=false;
  $('verify-feedback').textContent='Code sent. Check your inbox and enter it below.';
 }catch(e){$('verify-feedback').textContent=e.message;}
 finally{btn.disabled=false;}
});
$('verify-form').addEventListener('submit',async e=>{
 e.preventDefault();
 const btn=$('verify-confirm');btn.disabled=true;
 try{
  await emailAction('confirm',{code:$('verify-code').value.trim()});
  const user=(await api('me')).user;
  showProfile(user);
  void showWalletStatus(user,false);
  $('verify-feedback').textContent='Email verified successfully.';
 }catch(err){$('verify-feedback').textContent=err.message;}
 finally{btn.disabled=false;}
});
async function walletApi(action='status',method='GET'){
 const response=await fetch('../api/wallet?action='+encodeURIComponent(action),{
  method,credentials:'same-origin',cache:'no-store',
  headers:method==='POST'?{'Content-Type':'application/json'}:{},
  body:method==='POST'?'{}':undefined
 });
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(result.error||'Wallet activation unavailable');
 return result;
}
async function showWalletStatus(user,activateAutomatically=false){
 const area=$('account-activation'),feedback=$('activation-feedback'),button=$('activate-wallet');
 if(!area)return;
 area.hidden=!user.wallet||user.wallet.status!=='reserved';
 if(area.hidden)return;
 const requiresCompanyApproval=user.role==='manufacturer'&&user.organization?.status!=='verified';
 button.disabled=true;
 try{
  const status=await walletApi();
  if(status.status==='active'){
   area.hidden=true;
   $('profile-status').textContent='Active · NEAR testnet';
   return;
  }
  if(status.activation){
   button.disabled=true;
   feedback.textContent='Activation '+status.activation+'. Receipt '+(status.txHash||'not yet available')+'. No duplicate funding will be sent.';
   return;
  }
  if(requiresCompanyApproval){
   feedback.textContent='Your manufacturer organization must be approved before activation.';
   return;
  }
  if(!status.sponsorApproved){
   feedback.textContent='Sign-in is ready. Wallet sponsorship is awaiting an administrator\'s approval.';
   return;
  }
  if(!status.sponsorAvailable){
   button.disabled=true;
   feedback.textContent='Sponsor account has not been funded or configured. Your address remains reserved.';
   return;
  }
  feedback.textContent='Your account is approved for one-time testnet sponsorship.';
  button.disabled=false;
  if(activateAutomatically){await activateWallet();}
 }catch(e){button.disabled=true;feedback.textContent=e.message;}
}
async function activateWallet(){
 const button=$('activate-wallet');button.disabled=true;
 $('activation-feedback').textContent='Submitting one-time testnet activation…';
 try{
  const value=await walletApi('activate','POST');
  $('activation-feedback').textContent=value.notice||'Activation initiated.';
  if(value.status==='active'){$('profile-status').textContent='Active · NEAR testnet';$('account-activation').hidden=true;}
 }catch(e){$('activation-feedback').textContent=e.message;}
}
$('activate-wallet').addEventListener('click',activateWallet);
function showProfile(user){
  $('account-auth-box').hidden=true;
  $('account-profile').hidden=false;
  document.querySelector('.rb-account-tabs').hidden=true;
  $('profile-email').textContent=user.email;
  $('profile-phone').textContent=user.phoneNumber||'Not provided';
  $('profile-role').textContent=user.role==='manufacturer'?'Manufacturer':'Consumer';
  $('profile-wallet').textContent=user.wallet?.accountId||'Not provisioned';
  $('profile-status').textContent=user.wallet?.status==='reserved'
    ?'Reserved · awaiting NEAR testnet activation':user.wallet?.status||'Not provisioned';
  $('profile-company').textContent=user.organization
    ?user.organization.name+' · '+user.organization.status:'Not applicable';
  $('workspace-link').href=user.role==='manufacturer'?'../studio/':'../studio/';
  $('account-verify').hidden=true; // Optional verification is not part of demo onboarding.
  $('verify-form').hidden=true;
  $('verify-code').value='';
  $('verify-feedback').textContent='';
  $('account-issues').hidden=user.role!=='consumer';
  if(user.role==='consumer')void loadIssues();
  $('account-feedback').textContent='';
  void showWalletStatus(user,false);
}
function showForm(){
  $('account-auth-box').hidden=false;
  $('account-profile').hidden=true;
  document.querySelector('.rb-account-tabs').hidden=false;
  renderMode();
}
role.addEventListener('change',renderMode);
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
  mode=button.dataset.mode;renderMode();
}));
form.addEventListener('submit',async event=>{
  event.preventDefault();if(working||!ready)return;
  working=true;submit.disabled=true;setMessage('');
  const data=new FormData(form);
  const body={email:String(data.get('email')||''),password:String(data.get('password')||'')};
  if(mode==='signup'){body.phoneNumber=String(data.get('phoneNumber')||'');body.role=String(data.get('role')||'consumer');if(body.role==='manufacturer')body.companyName=String(data.get('companyName')||'');}
  try{
    const result=await api(mode==='signup'?'register':'login',{method:'POST',body});
    password.value='';showProfile(result.user);
    setMessage(result.notice||'Account loaded successfully.',true);
  }catch(e){setMessage(e.message||'The account request failed.');}
  finally{working=false;submit.disabled=!ready;}
});
$('account-logout').addEventListener('click',async()=>{
  try{await api('logout',{method:'POST'});showForm();setMessage('Signed out successfully.',true);}
  catch(e){setMessage(e.message);}
});
const requestedRole=new URLSearchParams(location.search).get('role');
if(requestedRole==='consumer'||requestedRole==='manufacturer'){role.value=requestedRole;renderMode();}
(async()=>{
  try{
    const status=await api('health');
    ready=Boolean(status.ready);
    if(!ready)throw Error('Account service is not configured');
    $('backend-state').textContent='Account service ready';$('backend-state').classList.add('is-ready');
    submit.disabled=false;
    try{const result=await api('me');if(result.user)showProfile(result.user);}catch{}
  }catch{
    ready=false;
    $('backend-state').textContent='Setup required';
    submit.disabled=true;
    setMessage('Secure registration is being connected to PostgreSQL. The live demo remains accessible, but new accounts cannot be created until the database and wallet vault are configured.');
  }
})();
