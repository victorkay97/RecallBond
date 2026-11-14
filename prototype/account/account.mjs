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
function showProfile(user){
  $('account-auth-box').hidden=true;
  $('account-profile').hidden=false;
  document.querySelector('.rb-account-tabs').hidden=true;
  $('profile-email').textContent=user.email;
  $('profile-role').textContent=user.role==='manufacturer'?'Manufacturer':'Consumer';
  $('profile-wallet').textContent=user.wallet?.accountId||'Not provisioned';
  $('profile-status').textContent=user.wallet?.status==='reserved'
    ?'Reserved · awaiting NEAR testnet activation':user.wallet?.status||'Not provisioned';
  $('profile-company').textContent=user.organization
    ?user.organization.name+' · '+user.organization.status:'Not applicable';
  $('workspace-link').href=user.role==='manufacturer'?'../business/':'../app/';
  $('account-issues').hidden=user.role!=='consumer';
  if(user.role==='consumer')void loadIssues();
  $('account-feedback').textContent='';
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
  if(mode==='signup'){body.role=String(data.get('role')||'consumer');if(body.role==='manufacturer')body.companyName=String(data.get('companyName')||'');}
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
