// Authenticated onchain actions. NEAR testnet ONLY. Uses encrypted, account-linked keys.
// No "connect issuer wallet": the user's stored wallet signs after verified authentication.
// Product ownership and campaign state always rechecked onchain before action.
import {randomBytes,createHash} from 'node:crypto';
import {neon} from '@neondatabase/serverless';
import {JsonRpcProvider,Account,nearToYocto,teraToGas} from 'near-api-js';
import {sessionDigest,decryptWalletSecret,normalizeEmail} from '../backend/auth-core.mjs';
import {RPC_URL,CONTRACT_ID} from '../backend/testnet-sponsor.mjs';
const provider=new JsonRpcProvider({url:RPC_URL});
const MAX_GAS=teraToGas('100');
export const config={maxDuration:30};
const out=(res,status,body)=>{res.setHeader('Cache-Control','no-store, private');res.setHeader('X-Content-Type-Options','nosniff');res.status(status).json(body);};
function getSession(req){
 const entry=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-rb_session='));
 const token=entry?entry.slice('__Host-rb_session='.length):'';
 return /^[a-zA-Z0-9_-]{43}$/.test(token)?token:null;
}
function checkOrigin(req){try{const u=new URL(String(req.headers.origin||''));return u.protocol==='https:'&&u.host===req.headers.host;}catch{return false;}}
async function current(sql,req){
 const token=getSession(req);if(!token)return null;
 const rows=await sql`SELECT u.id,u.email,u.role,u.email_verified_at,u.suspended_at,
 w.near_account_id,w.encrypted_secret,w.status wallet_status,
 o.id org_id,o.name org_name,o.status org_status,o.issuer_near_id
 FROM rb_sessions s JOIN rb_users u ON u.id=s.user_id
 JOIN rb_wallets w ON w.user_id=u.id
 LEFT JOIN rb_organizations o ON o.owner_user_id=u.id
 WHERE s.token_hash=${sessionDigest(token)} AND s.revoked_at IS NULL
 AND s.expires_at>now() AND u.suspended_at IS NULL LIMIT 1`;
 return rows[0]||null;
}
const tokenValid=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{3,63}$/.test(x);
const batchValid=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.-]{2,99}$/.test(x);
const idValid=x=>Number.isSafeInteger(x)&&x>=0;
const size=(s,min,max)=>typeof s==='string'&&s.trim().length>=min&&s.trim().length<=max;
const yocto=x=>{
 const n=String(x??'');
 if(!/^(0|[1-9][0-9]{0,24})(\.[0-9]{1,6})?$/.test(n))throw Error('Invalid testnet NEAR amount');
 return nearToYocto(n);
};
const txHash=o=>o?.transaction?.hash||o?.transaction_outcome?.id||null;
const resultVal=o=>{
 try{return JSON.parse(Buffer.from(o.status.SuccessValue,'base64').toString('utf8'))}catch{return null}
};
async function view(method,args){return provider.callFunction({contractId:CONTRACT_ID,method,args});}
async function signer(u){
 if(u.wallet_status!=='active'||!u.email_verified_at)throw Error('Email verification and active testnet wallet required');
 if(!process.env.RB_WALLET_MASTER_KEY)throw Error('Signing vault not configured');
 const key=decryptWalletSecret(u.encrypted_secret,process.env.RB_WALLET_MASTER_KEY);
 return new Account(u.near_account_id,provider,key);
}
async function call(u,method,args,deposit='0'){
 const acc=await signer(u);
 const outcome=await acc.callFunction({contractId:CONTRACT_ID,methodName:method,args,gas:MAX_GAS,deposit:nearToYocto(deposit)});
 if(outcome?.status?.Failure)throw Error('Onchain transaction failed');
 return outcome;
}
function allowedManufacturer(u){
 if(u.role!=='manufacturer'||!u.org_id||u.org_status!=='verified')throw Error('Verified manufacturer account required');
}
async function log(sql,u,action,tokenId,campaignId,tx,status='confirmed'){
 try{await sql`INSERT INTO rb_chain_audit(user_id,action,token_id,campaign_id,tx_hash,status)
  VALUES (${u.id},${action},${tokenId||null},${campaignId??null},${tx||null},${status})`;}
 catch{ /* never mask chain outcome due to audit outage */ }
}
export default async function handler(req,res){
 if(!['GET','POST'].includes(req.method))return out(res,405,{error:'Use GET or POST'});
 if(req.method==='POST'&&!checkOrigin(req))return out(res,403,{error:'Invalid request origin'});
 if(!process.env.DATABASE_URL)return out(res,503,{error:'Database is not configured'});
 try{
  const sql=neon(process.env.DATABASE_URL),u=await current(sql,req);
  if(!u)return out(res,401,{error:'Sign in to use real onchain actions'});
  const action=String(req.query.action||'');
  if(req.method==='GET'){
   if(action==='portfolio'){
    const products=await sql`SELECT token_id,title,batch_id FROM rb_onchain_products WHERE status='confirmed' ORDER BY created_at DESC LIMIT 80`;
    const owned=[];
    for(const p of products){
      try{const chain=await view('get_product',{token_id:p.token_id});if(chain?.owner_id===u.near_account_id)owned.push({...p,...chain});}
      catch{}
    }
    const credit=await view('get_credit',{account_id:u.near_account_id});
    // Match campaign registry with ACTUAL current owner holdings. Display live recall eligibility.
    const campaigns=await sql`SELECT campaign_id,batch_id FROM rb_onchain_campaigns ORDER BY created_at DESC LIMIT 80`;
    const recalls=[];
    for(const item of campaigns.filter(x=>owned.some(p=>p.batch_id===x.batch_id)).slice(0,20)){
      try{
        const campaign=await view('get_campaign',{id:Number(item.campaign_id)});
        const matches=owned.filter(p=>p.batch_id===item.batch_id);
        for(const p of matches){
          const claimant=await view('get_claimant',{campaign_id:Number(item.campaign_id),token_id:p.token_id});
          recalls.push({campaign,tokenId:p.token_id,claimant});
        }
      }catch{}
    }
    return out(res,200,{products:owned,recalls,creditYocto:String(credit),accountId:u.near_account_id,network:'testnet'});
   }
   if(action==='manufacturer'){
    allowedManufacturer(u);
    const [products,campaigns,issues]=await Promise.all([
      sql`SELECT token_id,title,batch_id,tx_hash,status,created_at FROM rb_onchain_products WHERE organization_id=${u.org_id} ORDER BY created_at DESC LIMIT 80`,
      sql`SELECT campaign_id,batch_id,create_tx_hash FROM rb_onchain_campaigns WHERE organization_id=${u.org_id} ORDER BY created_at DESC LIMIT 60`,
      sql`SELECT id,token_id,category,description,status,created_at FROM rb_issue_reports WHERE organization_id=${u.org_id} ORDER BY created_at DESC LIMIT 50`
    ]);
    const enriched=await Promise.all(campaigns.map(async c=>{
      try{return {...c,onchain:await view('get_campaign',{id:Number(c.campaign_id)})}}catch{return {...c,onchain:null}}
    }));
    return out(res,200,{products,campaigns:enriched,issues,issuerAccount:u.near_account_id,
     notice:'Issuer must also be explicitly authorized by the deployed NEAR contract. Platform verification alone does not authorize minting.'});
   }
   if(action==='recipient'){
    const email=normalizeEmail(req.query.email||'');
    const result=await sql`SELECT w.near_account_id FROM rb_users u JOIN rb_wallets w ON w.user_id=u.id
      WHERE u.email=${email} AND u.email_verified_at IS NOT NULL AND u.suspended_at IS NULL AND w.status='active' LIMIT 1`;
    if(!result.length)return out(res,404,{error:'No active verified wallet for that recipient'});
    return out(res,200,{accountId:result[0].near_account_id});
   }
   if(action==='campaign'){
    const id=Number(req.query.id);
    if(!idValid(id))return out(res,400,{error:'Invalid campaign'});
    const state=await view('get_campaign',{id});
    return out(res,200,{campaign:state});
   }
   if(action==='product'){
    const token=String(req.query.token_id||'');
    if(!tokenValid(token))return out(res,400,{error:'Invalid token'});
    const product=await view('get_product',{token_id:token});
    return out(res,200,{product});
   }
   return out(res,404,{error:'Unknown read action'});
  }
  const input=req.body;
  if(!input||typeof input!=='object'||Array.isArray(input)||Buffer.byteLength(JSON.stringify(input))>5000)
    return out(res,400,{error:'Invalid JSON body'});
  if(action==='transfer'){
    if(!tokenValid(input.tokenId))return out(res,400,{error:'Invalid passport'});
    const to=normalizeEmail(input.recipientEmail||'');
    const recipients=await sql`SELECT w.near_account_id FROM rb_users p JOIN rb_wallets w ON w.user_id=p.id
      WHERE p.email=${to} AND p.email_verified_at IS NOT NULL AND p.suspended_at IS NULL AND w.status='active' LIMIT 1`;
    if(!recipients.length)return out(res,400,{error:'Recipient must have a verified active RecallBond wallet'});
    const receiver=recipients[0].near_account_id;
    if(receiver===u.near_account_id)return out(res,400,{error:'Already owned by this user'});
    const product=await view('get_product',{token_id:input.tokenId});
    if(!product||product.owner_id!==u.near_account_id)return out(res,403,{error:'Only current onchain owner may transfer'});
    const tx=await call(u,'nft_transfer',{receiver_id:receiver,token_id:input.tokenId},'0.000000000000000000000001');
    await log(sql,u,'nft_transfer',input.tokenId,null,txHash(tx));
    return out(res,200,{ok:true,txHash:txHash(tx),newOwner:receiver});
  }
  if(action==='claim'){
    const id=Number(input.campaignId),tokenId=input.tokenId;
    if(!idValid(id)||!tokenValid(tokenId))return out(res,400,{error:'Invalid claim inputs'});
    const [campaign,product,previous]=await Promise.all([
      view('get_campaign',{id}),view('get_product',{token_id:tokenId}),
      view('get_claimant',{campaign_id:id,token_id:tokenId})
    ]);
    if(previous)return out(res,409,{error:'Already claimed'});
    if(!campaign?.activated||campaign?.closed||product?.owner_id!==u.near_account_id||
       campaign.batch_id!==product.batch_id||campaign.manufacturer!==product.manufacturer||
       BigInt(campaign.funded_yocto)<BigInt(campaign.payout_yocto))return out(res,403,{error:'Not eligible for this claim'});
    // Storage attached deposit is refunded above actual storage charge by the contract.
    const tx=await call(u,'claim_compensation',{campaign_id:id,token_id:tokenId},'0.02');
    await log(sql,u,'claim_compensation',tokenId,id,txHash(tx));
    return out(res,200,{ok:true,txHash:txHash(tx),creditYocto:String(campaign.payout_yocto)});
  }
  if(action==='withdraw'){
    const credit=await view('get_credit',{account_id:u.near_account_id});
    if(BigInt(String(credit))===0n)return out(res,409,{error:'No approved compensation to withdraw'});
    const tx=await call(u,'withdraw_compensation',{},'0');
    await log(sql,u,'withdraw_compensation',null,null,txHash(tx));
    return out(res,200,{ok:true,txHash:txHash(tx),outcome:resultVal(tx)});
  }
  if(action==='mint'){
    allowedManufacturer(u);
    if(!batchValid(input.batchId)||!size(input.title,3,75)||!size(input.serial,4,100))
      return out(res,400,{error:'Provide a valid batch, product title and serial'});
    const ownerEmail=normalizeEmail(input.ownerEmail||'');
    const owners=await sql`SELECT w.near_account_id FROM rb_users p JOIN rb_wallets w ON w.user_id=p.id
      WHERE p.email=${ownerEmail} AND p.email_verified_at IS NOT NULL AND p.suspended_at IS NULL AND w.status='active' LIMIT 1`;
    if(!owners.length)return out(res,400,{error:'Owner must have a verified active RecallBond account'});
    const tokenId='RB-'+randomBytes(6).toString('hex').toUpperCase();
    const serialSalt=randomBytes(16).toString('hex');
    const commitment=createHash('sha256').update(u.near_account_id+'|'+input.serial+'|'+serialSalt).digest('hex');
    // Reserve token before signing. Any uncertain outcome stays for manual reconciliation, never automatic remint.
    await sql`INSERT INTO rb_onchain_products(token_id,issuer_user_id,organization_id,batch_id,
      serial_commitment,title,original_owner_account_id,status)
      VALUES (${tokenId},${u.id},${u.org_id},${input.batchId},${commitment},${input.title.trim()},${owners[0].near_account_id},'sending')`;
    try {
      const tx=await call(u,'mint_product',{
        token_id:tokenId,owner_id:owners[0].near_account_id,batch_id:input.batchId,
        serial_commitment:commitment,token_metadata:{
          title:input.title.trim(),description:'RecallBond digital product passport · NEAR testnet',
          media:'https://recallbond.vercel.app/assets/passport-nft-cover.svg'
        }
      },'1');
      await sql`UPDATE rb_onchain_products SET status='confirmed',tx_hash=${txHash(tx)} WHERE token_id=${tokenId}`;
      await log(sql,u,'mint_product',tokenId,null,txHash(tx));
      return out(res,201,{ok:true,tokenId,txHash:txHash(tx),ownerAccount:owners[0].near_account_id});
    }catch(e){
      await sql`UPDATE rb_onchain_products SET status='manual_review' WHERE token_id=${tokenId}`;
      throw e;
    }
  }
  if(action==='create_campaign'){
    allowedManufacturer(u);
    const batch=input.batchId;
    if(!batchValid(batch))return out(res,400,{error:'Invalid batch ID'});
    const prior=await sql`SELECT campaign_id FROM rb_onchain_campaigns WHERE organization_id=${u.org_id} AND batch_id=${batch} LIMIT 1`;
    if(prior.length)return out(res,409,{error:'A recall campaign already exists for this batch'});
    const available=await sql`SELECT count(*)::int c FROM rb_onchain_products WHERE organization_id=${u.org_id}
      AND batch_id=${batch} AND status='confirmed'`;
    if(available[0].c===0)return out(res,400,{error:'No confirmed passports in this batch'});
    const payout=yocto(input.payoutNear);
    if(BigInt(payout)<BigInt(nearToYocto('0.001'))||BigInt(payout)>BigInt(nearToYocto('0.25')))
      return out(res,400,{error:'Payout must be between 0.001 and 0.25 testnet NEAR per device'});
    const expiryDays=Number(input.expiryDays);
    if(!Number.isInteger(expiryDays)||expiryDays<1||expiryDays>30)return out(res,400,{error:'Expiry must be 1–30 days'});
    const expiryNs=Number((BigInt(Math.floor(Date.now()/1000)+expiryDays*86400))*1000000000n);
    const tx=await call(u,'create_campaign',{batch_id:batch,payout_yocto:String(payout),expiry_ns:expiryNs},'0.1');
    const id=resultVal(tx);
    if(!idValid(id))return out(res,202,{txHash:txHash(tx),notice:'Campaign transaction submitted; ID needs operator confirmation'});
    await sql`INSERT INTO rb_onchain_campaigns(campaign_id,organization_id,batch_id,create_tx_hash)
      VALUES (${id},${u.org_id},${batch},${txHash(tx)}) ON CONFLICT(campaign_id) DO NOTHING`;
    await log(sql,u,'create_campaign',null,id,txHash(tx));
    return out(res,201,{campaignId:id,txHash:txHash(tx)});
  }
  if(action==='fund_campaign'||action==='activate_campaign'||action==='close_campaign'){
    allowedManufacturer(u);
    const id=Number(input.campaignId);
    if(!idValid(id))return out(res,400,{error:'Invalid campaign'});
    const rows=await sql`SELECT campaign_id FROM rb_onchain_campaigns WHERE campaign_id=${id} AND organization_id=${u.org_id} LIMIT 1`;
    if(!rows.length)return out(res,403,{error:'Not your registered campaign'});
    const state=await view('get_campaign',{id});
    if(state.manufacturer!==u.near_account_id)return out(res,403,{error:'Onchain issuer mismatch'});
    let tx,method;
    if(action==='fund_campaign'){
      if(state.activated||state.closed) return out(res,409,{error:'Campaign is not accepting funds'});
      const remaining=BigInt(state.max_liability_yocto)-BigInt(state.funded_yocto);
      if(remaining<=0n||remaining>BigInt(nearToYocto('2')))
        return out(res,400,{error:'Cannot fund this liability automatically; use operator review'});
      // Exact remaining liability required; balance never exceeds contract's maximum.
      const issuer=await signer(u);
      tx=await issuer.callFunction({contractId:CONTRACT_ID,methodName:'fund_campaign',
        args:{campaign_id:id},gas:MAX_GAS,deposit:remaining});
      method='fund_campaign';
    }else if(action==='activate_campaign'){
      if(state.activated||state.closed||String(state.max_liability_yocto)!==String(state.funded_yocto))
        return out(res,409,{error:'Fund the full liability before activating'});
      tx=await call(u,'activate_campaign',{campaign_id:id},'0');method='activate_campaign';
    }else{
      if(state.closed||BigInt(state.expiry_ns)>BigInt(Date.now())*1000000n)
        return out(res,409,{error:'Campaign cannot be closed before expiry'});
      tx=await call(u,'close_campaign',{campaign_id:id},'0.01');method='close_campaign';
    }
    if(tx?.status?.Failure)throw Error('Onchain action failed');
    await log(sql,u,method,null,id,txHash(tx));
    return out(res,200,{ok:true,txHash:txHash(tx),campaignId:id});
  }
  if(action==='review_issue'){
    allowedManufacturer(u);
    const id=String(input.id||''),status=String(input.status||'');
    if(!/^[0-9a-f-]{36}$/i.test(id)||!['under_review','more_info','approved_repair','approved_replacement','declined'].includes(status))
      return out(res,400,{error:'Invalid support-review request'});
    const row=await sql`UPDATE rb_issue_reports SET status=${status},updated_at=now()
      WHERE id=${id} AND organization_id=${u.org_id} RETURNING id`;
    if(!row.length)return out(res,404,{error:'Issue not assigned to your company'});
    return out(res,200,{ok:true,status,notice:'Support decision saved. Compensation is separate and requires a funded NEAR recall campaign.'});
  }
  return out(res,404,{error:'Unknown onchain action'});
 }catch(e){
   const msg=String(e?.message||'');
   // No internal keys or RPC stack frames are reflected in the HTTP response.
   if(/Invalid|valid|verified|eligible|owned|registered|only current|Already|No approved|not eligible|issuer|wallet required|company/i.test(msg))
     return out(res,400,{error:msg.slice(0,170)});
   console.error('RB_CHAIN_ACTION',{code:e?.code||'chain_error'});
   return out(res,502,{error:'Testnet transaction or contract preflight failed. Review the chain before retrying.'});
 }
}
