// Authenticated owner-initiated NEAR testnet activation (no wallet-connection popup).
// A dedicated sponsor key is mandatory and funds can be sent only once per user.
// Never auto-retry an uncertain onchain transaction: operator reconciliation required.
import {neon} from '@neondatabase/serverless';
import {sessionDigest} from '../backend/auth-core.mjs';
import {sponsorConfigured,accountExists,sponsorImplicitAccount} from '../backend/testnet-sponsor.mjs';
const respond=(res,status,json)=>{res.setHeader('Cache-Control','no-store, private');res.setHeader('X-Content-Type-Options','nosniff');res.status(status).json(json);};
function cookie(req){
 const item=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-rb_session='));
 const token=item?item.slice('__Host-rb_session='.length):'';
 return /^[A-Za-z0-9_-]{43}$/.test(token)?token:null;
}
function originOkay(req){try{const url=new URL(String(req.headers.origin||''));return url.protocol==='https:'&&url.host===req.headers.host;}catch{return false;}}
async function loggedIn(sql,req){
 const token=cookie(req);if(!token)return null;
 const r=await sql`SELECT u.id,u.role,u.email_verified_at,w.near_account_id,w.status wallet_status,
 o.status company_status,(a.user_id IS NOT NULL) AS sponsor_approved FROM rb_sessions s
 JOIN rb_users u ON u.id=s.user_id JOIN rb_wallets w ON w.user_id=u.id
 LEFT JOIN rb_organizations o ON o.owner_user_id=u.id
 LEFT JOIN rb_sponsor_approvals a ON a.user_id=u.id
 WHERE s.token_hash=${sessionDigest(token)} AND s.expires_at>now()
 AND s.revoked_at IS NULL AND u.suspended_at IS NULL LIMIT 1`;
 return r[0]||null;
}
export const config={maxDuration:30};
export default async function handler(req,res){
 if(!['GET','POST'].includes(req.method))return respond(res,405,{error:'Use GET or POST'});
 if(!process.env.DATABASE_URL)return respond(res,503,{error:'Wallet database not configured'});
 if(req.method==='POST'&&!originOkay(req))return respond(res,403,{error:'Invalid request origin'});
 try{
  const sql=neon(process.env.DATABASE_URL),user=await loggedIn(sql,req);
  if(!user)return respond(res,401,{error:'Sign in required'});
  const action=String(req.query.action||'status');
  const record=await sql`SELECT account_id,status,tx_hash,created_at,updated_at FROM rb_wallet_activations
    WHERE user_id=${user.id} LIMIT 1`;
  if(action==='status'&&req.method==='GET'){
    const row=record[0];
    if(user.wallet_status==='reserved'&&(!row||['submitted','sending','manual_review'].includes(row.status))){
      // A signed transfer can complete while the server is offline. Reconcile without sending again.
      try{
        if(await accountExists(user.near_account_id)){
          await sql.transaction([
            sql`UPDATE rb_wallets SET status='active' WHERE user_id=${user.id}`,
            sql`UPDATE rb_wallet_activations SET status='active',updated_at=now() WHERE user_id=${user.id}`
          ]);
          return respond(res,200,{status:'active',accountId:user.near_account_id,txHash:row?.tx_hash||null});
        }
      }catch{}
    }
    return respond(res,200,{status:user.wallet_status,activation:row?.status||null,accountId:user.near_account_id,
     txHash:row?.tx_hash||null,sponsorAvailable:sponsorConfigured(),sponsorApproved:Boolean(user.sponsor_approved),
     notice:'Testnet implicit accounts are activated after a confirmed sponsor transfer.'});
  }
  if(action!=='activate'||req.method!=='POST')return respond(res,404,{error:'Unknown wallet action'});
  if(user.wallet_status==='active')return respond(res,200,{status:'active',accountId:user.near_account_id});
   if(record[0])return respond(res,409,{error:'Activation already initiated. Check status or ask support for reconciliation; never send a second automatic deposit.',activation:record[0].status});
   // An already-funded implicit account needs no sponsor approval or email proof.
   if(await accountExists(user.near_account_id)){
     await sql`UPDATE rb_wallets SET status='active' WHERE user_id=${user.id}`;
     return respond(res,200,{status:'active',accountId:user.near_account_id,notice:'Existing onchain account confirmed'});
   }
   if(!user.sponsor_approved)return respond(res,403,{error:'Automatic wallet funding requires operator approval'});
   if(user.role==='manufacturer'&&user.company_status!=='verified')return respond(res,403,{error:'Manufacturer must pass company verification first'});
   if(!sponsorConfigured())return respond(res,503,{error:'NEAR sponsor is not configured yet; your address remains reserved'});
  const maxSlots=Math.max(1,Math.min(5,Number(process.env.RB_SPONSOR_DAILY_MAX||3)));
  const amount=user.role==='manufacturer'?'1200000000000000000000000':'50000000000000000000000';
  const reserved=await sql`INSERT INTO rb_wallet_activations(user_id,account_id,amount_yocto,funding_day,funding_slot,status)
  SELECT ${user.id},${user.near_account_id},${amount}::numeric,(now() AT TIME ZONE 'UTC')::date,slots.n,'sending'
  FROM generate_series(1,${maxSlots}) AS slots(n)
  WHERE NOT EXISTS (SELECT 1 FROM rb_wallet_activations a WHERE a.funding_day=(now() AT TIME ZONE 'UTC')::date AND a.funding_slot=slots.n)
  ORDER BY slots.n LIMIT 1 ON CONFLICT DO NOTHING RETURNING user_id`;
  if(!reserved.length)return respond(res,429,{error:'Daily testnet activation limit reached. Try tomorrow or contact an administrator.'});
  try {
    const sent=await sponsorImplicitAccount(user.near_account_id,user.role);
    await sql`UPDATE rb_wallet_activations SET status='submitted',tx_hash=${sent.txHash},updated_at=now()
      WHERE user_id=${user.id} AND status='sending'`;
    let active=false;
    try{active=await accountExists(user.near_account_id);}catch{}
    if(active){
      await sql.transaction([
        sql`UPDATE rb_wallets SET status='active' WHERE user_id=${user.id}`,
        sql`UPDATE rb_wallet_activations SET status='active',updated_at=now() WHERE user_id=${user.id}`
      ]);
    }
    return respond(res,200,{status:active?'active':'submitted',accountId:user.near_account_id,txHash:sent.txHash,
      notice:active?'NEAR testnet wallet activated':'Funding submitted. Check wallet status again shortly.'});
  }catch {
    // Do not retry uncertain NEAR transfers automatically; a write might have landed before transport failed.
    await sql`UPDATE rb_wallet_activations SET status='manual_review',updated_at=now() WHERE user_id=${user.id} AND status='sending'`;
    return respond(res,502,{error:'Sponsor transfer needs review. No automatic retry will occur; check the chain before deciding what to do.'});
  }
 }catch(e){
   console.error('RB_WALLET_ACTIVATE',{code:e?.code||'runtime_error'});
   return respond(res,500,{error:'Wallet activation unavailable'});
 }
}
