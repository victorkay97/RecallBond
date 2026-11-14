// RecallBond admin UI. Real database records only; no fabricated placeholder metrics.
// HTML is created via DOM APIs to prevent user-supplied data from becoming markup.
const $=id=>document.getElementById(id);
let snapshot=null,tab='overview',busy=false;
const labels={overview:'System overview',users:'Registered users',companies:'Manufacturers',issues:'Issue reports',audit:'Audit trail'};
const icons={home:'home',users:'wallet',companies:'box',issues:'shield',audit:'clock'};
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x;}
function ico(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','../assets/mingcute.svg#'+name);svg.append(use);return svg;}
function message(value,bad=false){$('adm-message').textContent=value;$('adm-message').classList.toggle('is-error',bad);}
const time=x=>x?new Date(x).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'—';
function chip(value){
 const p=el('span','adm-pill',value);
 if(['suspended','unverified','reserved','submitted','under_review'].includes(String(value).toLowerCase()))p.classList.add('muted');
 if(['disabled','declined'].includes(String(value).toLowerCase()))p.classList.add('bad');
 return p;
}
async function request(action='overview',method='GET',body){
 const opts={method,headers:{Accept:'application/json'},credentials:'same-origin',cache:'no-store'};
 if(body){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
 const response=await fetch('/api/admin?action='+encodeURIComponent(action),opts);
 const value=await response.json().catch(()=>({}));
 if(!response.ok){const er=new Error(value.error||'Admin API unavailable');er.status=response.status;throw er;}
 return value;
}
function tabTo(next){
 if(!labels[next])return;
 tab=next;$('tab-heading').textContent=labels[next];
 document.querySelectorAll('[data-tab]').forEach(x=>{
  if(x.classList.contains('adm-nav')||!x.closest('.adm-nav'))return;
  x.setAttribute('aria-current',x.dataset.tab===tab?'page':'false');
 });
 document.querySelectorAll('.adm-view').forEach(x=>x.hidden=x.id!=='view-'+tab);
 history.replaceState(null,'','#'+tab);
}
document.querySelectorAll('[data-tab]').forEach(x=>x.addEventListener('click',()=>tabTo(x.dataset.tab)));
function miniRow(title,secondary,right){
 const row=el('div','adm-mini-row'),a=el('div');a.append(el('strong','',title),el('small','',secondary));
 row.append(a,right instanceof Node?right:el('span','',right));return row;
}
function stat(name,value,foot,icon){
 const box=el('article','adm-stat'),label=el('div','adm-stat-name');
 label.append(ico(icon),el('span','',name));box.append(label,el('strong','',value),el('small','',foot));return box;
}
function renderOverview(d){
 const m=d.metrics,container=$('stats');container.replaceChildren(
  stat('Product owners',m.consumers,'Registered consumer accounts','wallet'),
  stat('Manufacturers',m.manufacturers,'Registered company accounts','box'),
  stat('Open reports',m.open_issues,'Waiting for review','shield'),
  stat('Active wallets',m.active_wallets,'Onchain-active (not reserved)','transfer'),
  stat('Reserved wallets',m.reserved_wallets,'Pending testnet activation','scan'),
  stat('Verified companies',m.verified_companies,'Approved in platform only','shield'),
  stat('Suspended accounts',m.suspended_users,'Platform access denied','archive'),
  stat('All issue reports',m.issue_reports,'Submitted by registered consumers','clock')
 );
 const u=$('recent-users'),c=$('recent-companies');u.replaceChildren();c.replaceChildren();
 if(!d.users.length)u.append(miniRow('No registered users','No data yet','—'));
 else for(const x of d.users.slice(0,5))u.append(miniRow(x.email,x.role+' · '+time(x.created_at),chip(x.suspended_at?'suspended':'active')));
 if(!d.companies.length)c.append(miniRow('No organizations','No data yet','—'));
 else for(const x of d.companies.slice(0,5))c.append(miniRow(x.name,x.owner_email,chip(x.status)));
}
function td(row,child){const c=el('td');if(child instanceof Node)c.append(child);else c.textContent=String(child??'—');row.append(c);return c;}
function button(label,fn,danger=false){
 const b=el('button','adm-button'+(danger?' danger':''),label);b.type='button';
 b.addEventListener('click',async()=>{if(busy)return;busy=true;b.disabled=true;try{await fn();}catch(e){message(e.message,true);}finally{busy=false;b.disabled=false;}});return b;
}
async function act(action,data,phrase){
 if(phrase&&!confirm(phrase))return;
 message('Saving action…');
 const result=await request(action,'POST',data);
 message(result.notice||'Change saved');
 await reload(false);
}
function renderUsers(items){
 const root=$('user-rows');root.replaceChildren();
 for(const x of items){
  const tr=el('tr'),person=el('div');person.append(el('strong','',x.email));person.append(el('small','',x.id));
  td(tr,person);td(tr,chip(x.role));
  td(tr,chip(x.email_verified_at?'Verified':'Unverified'));
  const w=el('div');w.append(chip(x.wallet_status||'unknown'),el('small','',x.near_account_id?.slice(0,15)+'…'||'—'));
  td(tr,w);td(tr,time(x.created_at));
  const actions=el('div','adm-cell-actions');
  if(x.suspended_at)actions.append(button('Reinstate',()=>act('reinstate_user',{id:x.id},'Restore this user\'s platform access?')));
  else actions.append(button('Suspend',()=>{const reason=prompt('Reason for suspending '+x.email+' (required)');if(!reason)return;return act('suspend_user',{id:x.id,reason},'Suspend this account and revoke all sessions?');},true));
  td(tr,actions);root.append(tr);
 }
 if(!items.length){const row=el('tr');const cell=td(row,'No users found');cell.colSpan=6;root.append(row);}
}
function renderCompanies(items){
 const root=$('company-rows');root.replaceChildren();
 for(const x of items){
  const tr=el('tr');const a=el('div');a.append(el('strong','',x.name),el('small','',time(x.created_at)));
  td(tr,a);td(tr,x.owner_email);td(tr,chip(x.status));td(tr,x.issuer_near_id||'Not registered');
  const actions=el('div','adm-cell-actions');
  if(x.status!=='verified')actions.append(button('Verify',()=>act('verify_company',{id:x.id},'Have you independently verified this company? This approval does NOT grant onchain issuer rights.')));
  if(x.status==='verified'&&/^[0-9a-f]{64}$/.test(x.issuer_candidate||''))actions.append(button('Copy issuer CLI',async()=>{
   const account=x.issuer_candidate;
   const script='$issuerId = "'+account+'"\n'
    +'$path = "$HOME\\RecallBond-testnet\\issuer-registration.json"\n'
    +'$json = @{ manufacturer = $issuerId } | ConvertTo-Json -Compress\n'
    +'[System.IO.File]::WriteAllText($path,$json,(New-Object System.Text.UTF8Encoding($false)))\n'
    +'near contract call-function as-transaction rb-vk97-261112.testnet register_manufacturer file-args $path prepaid-gas "50 Tgas" attached-deposit "0.1 NEAR" sign-as rb-vk97-261112.testnet network-config testnet sign-with-keychain send';
   if(!navigator.clipboard?.writeText)throw Error('Clipboard not available. Ask the operator to copy the registration instructions from docs.');
   await navigator.clipboard.writeText(script);
   message('PowerShell issuer registration command copied. Run it locally as the NEAR contract admin, then verify the transaction. Never upload the admin key.');
  }));
  if(x.status!=='suspended')actions.append(button('Suspend',()=>act('suspend_company',{id:x.id},'Suspend this company in the RecallBond platform?'),true));
  td(tr,actions);root.append(tr);
 }
 if(!items.length){const row=el('tr');const c=td(row,'No companies found');c.colSpan=5;root.append(row);}
}
function renderIssues(items){
 const root=$('issue-rows');root.replaceChildren();
 for(const x of items){
  const tr=el('tr');td(tr,x.token_id);td(tr,x.submitter);
  const info=el('div');info.append(el('strong','',x.category),el('small','adm-desc',x.description));td(tr,info);
  td(tr,chip(x.status));
  const select=el('select','adm-button');
  for(const name of ['submitted','under_review','more_info','approved_repair','approved_replacement','declined']){
   const option=el('option','',name.replace(/_/g,' '));option.value=name;option.selected=x.status===name;select.append(option);
  }
  select.setAttribute('aria-label','Review issue '+x.token_id);
  const controls=el('div','adm-cell-actions');controls.append(select,button('Save',()=>act('review_issue',{id:x.id,status:select.value},'Update issue status? This does NOT trigger compensation.')));
  td(tr,controls);root.append(tr);
 }
 if(!items.length){const row=el('tr');const c=td(row,'No issue reports');c.colSpan=5;root.append(row);}
}
function renderAudit(items){
 const root=$('audit-rows');root.replaceChildren();
 for(const x of items){const row=el('tr');td(row,chip(x.action.replace(/_/g,' ')));td(row,x.actor);td(row,x.target_type+' / '+x.target_id.slice(0,8));td(row,time(x.created_at));root.append(row);}
 if(!items.length){const row=el('tr');const c=td(row,'No administrative changes yet');c.colSpan=4;root.append(row);}
}
async function reload(showLoading=true){
 if(showLoading)message('Refreshing live administrative records…');
 try{
  const data=await request();snapshot=data;
  $('admin-who').textContent='Signed in as '+data.administrator.email;
  renderOverview(data);renderUsers(data.users);renderCompanies(data.companies);renderIssues(data.issues);renderAudit(data.audit);
  if(showLoading)message('Live records loaded. Review carefully before changing access.');
 }catch(e){
  message(e.message,true);
  if(e.status===403){
    const panel=el('div','adm-access');panel.append(el('h2','','Administrator access required'),el('p','','Sign in with a verified account that has been explicitly granted administrative membership. Public signup does not create admins.'));
    const link=el('a','','Go to account sign-in');link.href='../account/';panel.append(link);
    $('view-overview').replaceChildren(panel);
  }
 }
}
$('refresh').addEventListener('click',()=>reload());
tabTo(['overview','users','companies','issues','audit'].includes(location.hash.slice(1))?location.hash.slice(1):'overview');
reload();
