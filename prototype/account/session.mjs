// Decorative session status only. Never treats a browser account as blockchain signing permission.
(async()=>{
  const host=document.querySelector('main.app-wrap');
  if(!host)return;
  let response,data;
  try{
    response=await fetch('../api/auth?action=me',{credentials:'same-origin',cache:'no-store'});
    if(!response.ok)return;
    data=await response.json();
  }catch{return;}
  const u=data?.user;if(!u)return;
  const isBusiness=document.body.classList.contains('business-v4');
  const banner=document.createElement('div');
  banner.className='rb-session-notice';
  banner.setAttribute('role','status');
  const heading=document.createElement('strong');
  heading.textContent='Signed in: '+u.email;
  const desc=document.createElement('span');
  if(isBusiness){
    desc.textContent=' Your company: '+(u.organization?.name||'No company')+' ('+(u.organization?.status||'unverified')+'). The NovaTech dashboard below is a fictional testnet example, not your organization’s live data.';
  }else{
    desc.textContent=' Linked NEAR address: '+(u.wallet?.accountId?.slice(0,12)||'Pending')+'… ('+(u.wallet?.status||'pending')+'). The example passports below are not automatically owned by this account.';
  }
  const link=document.createElement('a');link.href='../account/';link.textContent='My account';
  banner.append(heading,desc,link);
  const live=host.querySelector('.rb-consumer-note,.rb-live-strip');
  if(live)live.insertAdjacentElement('afterend',banner);else host.prepend(banner);
})();
