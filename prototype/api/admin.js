// RecallBond admin console API — platform operations ONLY; no blockchain signing.
// Membership is granted explicitly in the database after verified identity review.
// No admin secret or email/password is baked into public code.
import {neon} from '@neondatabase/serverless';
import {sessionDigest} from '../backend/auth-core.mjs';

const reply=(res,status,payload)=>{res.setHeader('Cache-Control','no-store, private');res.setHeader('X-Content-Type-Options','nosniff');res.status(status).json(payload)};
const isUUID=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
function sameOrigin(req){try{const u=new URL(String(req.headers.origin||''));return u.protocol==='https:'&&u.host===req.headers.host;}catch{return false;}}
function cookie(req){
 const v=(String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-rb_session='))||'').split('=')[1]||'';
 return /^[A-Za-z0-9_-]{43}$/.test(v)?v:'';
}
async function admin(sql,req){
 const tok=cookie(req);if(!tok)return null;
 const rows=await sql`SELECT u.id,u.email,u.email_verified_at FROM rb_sessions s
 JOIN rb_users u ON u.id=s.user_id
 JOIN rb_admin_memberships a ON a.user_id=u.id
 WHERE s.token_hash=${sessionDigest(tok)}
 AND s.expires_at>now() AND s.revoked_at IS NULL
 AND u.suspended_at IS NULL LIMIT 1`;
 return rows[0]||null;
}
export default async function handler(req,res){
 if(!process.env.DATABASE_URL)return reply(res,503,{error:'Admin storage not configured'});
 if(!['GET','POST'].includes(req.method))return reply(res,405,{error:'Unsupported method'});
 if(req.method==='POST'&&!sameOrigin(req))return reply(res,403,{error:'Invalid origin'});
 try {
  const sql=neon(process.env.DATABASE_URL),actor=await admin(sql,req);
  if(!actor)return reply(res,403,{error:'Administrator membership required'});
  const action=String(req.query?.action||'overview');
  if(req.method==='GET'){
   if(action!=='overview')return reply(res,404,{error:'Unknown request'});
   const [metrics,users,companies,issues,audit]=await Promise.all([
    sql`SELECT
       (SELECT count(*)::int FROM rb_users WHERE role='consumer') AS consumers,
       (SELECT count(*)::int FROM rb_users WHERE role='manufacturer') AS manufacturers,
       (SELECT count(*)::int FROM rb_users WHERE suspended_at IS NOT NULL) AS suspended_users,
       (SELECT count(*)::int FROM rb_organizations WHERE status='verified') AS verified_companies,
       (SELECT count(*)::int FROM rb_wallets WHERE status='active') AS active_wallets,
       (SELECT count(*)::int FROM rb_wallets WHERE status='reserved') AS reserved_wallets,
       (SELECT count(*)::int FROM rb_issue_reports) AS issue_reports,
       (SELECT count(*)::int FROM rb_issue_reports WHERE status='submitted') AS open_issues`,
    sql`SELECT u.id,u.email,u.role,u.created_at,u.email_verified_at,u.suspended_at,
      w.status wallet_status,w.near_account_id,
      (a.user_id IS NOT NULL) AS sponsor_approved
      FROM rb_users u LEFT JOIN rb_wallets w ON w.user_id=u.id
      LEFT JOIN rb_sponsor_approvals a ON a.user_id=u.id
      ORDER BY u.created_at DESC LIMIT 40`,
    sql`SELECT o.id,o.name,o.status,o.created_at,o.issuer_near_id,u.email owner_email,
      w.near_account_id issuer_candidate
      FROM rb_organizations o JOIN rb_users u ON u.id=o.owner_user_id
      LEFT JOIN rb_wallets w ON w.user_id=o.owner_user_id
      ORDER BY o.created_at DESC LIMIT 40`,
    sql`SELECT i.id,i.token_id,i.category,i.description,i.status,i.created_at,u.email submitter
      FROM rb_issue_reports i JOIN rb_users u ON u.id=i.consumer_user_id
      ORDER BY i.created_at DESC LIMIT 40`,
    sql`SELECT log.action,log.target_type,log.target_id,log.created_at,u.email actor
      FROM (
        SELECT a.action,a.target_type,a.target_id,a.created_at,a.actor_user_id FROM rb_admin_audit a
        UNION ALL
        SELECT 'approve_sponsor' AS action,'user' AS target_type,s.user_id AS target_id,
          s.granted_at AS created_at,s.granted_by AS actor_user_id FROM rb_sponsor_approvals s
      ) log JOIN rb_users u ON u.id=log.actor_user_id
      ORDER BY log.created_at DESC LIMIT 30`
   ]);
   return reply(res,200,{administrator:{email:actor.email},metrics:metrics[0],users,companies,issues,audit,
    limits:{users:40,companies:40,issues:40},network:'testnet',dataScope:'platform_database',
    notice:'This console manages RecallBond platform records. Company approval does not grant onchain issuer rights and does not move NEAR.'});
  }
  const payload=typeof req.body==='object'&&!Array.isArray(req.body)?req.body:{};
  if(Buffer.byteLength(JSON.stringify(payload))>4096)return reply(res,413,{error:'Payload too large'});
  const id=payload.id,reason=typeof payload.reason==='string'?payload.reason.trim():'';
  if(!isUUID(id))return reply(res,400,{error:'Invalid target ID'});
  if(action==='suspend_user'||action==='reinstate_user'){
    if(id===actor.id)return reply(res,403,{error:'Cannot change your own access'});
    const existing=await sql`SELECT u.id,u.role,u.suspended_at,
      EXISTS (SELECT 1 FROM rb_admin_memberships a WHERE a.user_id=u.id) is_admin
      FROM rb_users u WHERE u.id=${id} LIMIT 1`;
    if(!existing[0])return reply(res,404,{error:'User not found'});
    if(existing[0].is_admin)return reply(res,403,{error:'Administrator accounts require manual security review'});
    if(action==='suspend_user'&&(!reason||reason.length>200))return reply(res,400,{error:'Enter a reason of up to 200 characters'});
    const statements=action==='suspend_user'?
      [
        sql`UPDATE rb_users SET suspended_at=now(),suspension_reason=${reason} WHERE id=${id}`,
        sql`UPDATE rb_sessions SET revoked_at=now() WHERE user_id=${id} AND revoked_at IS NULL`,
        sql`INSERT INTO rb_admin_audit(actor_user_id,action,target_type,target_id,detail)
          VALUES (${actor.id},'suspend_user','user',${id},${reason})`
      ]:[
        sql`UPDATE rb_users SET suspended_at=NULL,suspension_reason=NULL WHERE id=${id}`,
        sql`INSERT INTO rb_admin_audit(actor_user_id,action,target_type,target_id,detail)
          VALUES (${actor.id},'reinstate_user','user',${id},NULL)`
      ];
    await sql.transaction(statements);
    return reply(res,200,{ok:true,action,notice:'Platform user state updated; any active sessions were revoked on suspension.'});
  }
  if(action==='approve_sponsor'){
    if(id===actor.id)return reply(res,403,{error:'Operators cannot sponsor their own wallets'});
    const target=await sql`SELECT u.id,u.role,u.suspended_at,w.status wallet_status,
      o.status company_status FROM rb_users u
      JOIN rb_wallets w ON w.user_id=u.id
      LEFT JOIN rb_organizations o ON o.owner_user_id=u.id
      WHERE u.id=${id} LIMIT 1`;
    if(!target.length)return reply(res,404,{error:'User not found'});
    if(target[0].suspended_at)return reply(res,403,{error:'Suspended account cannot receive sponsor approval'});
    if(target[0].wallet_status!=='reserved')return reply(res,409,{error:'Wallet is not awaiting activation'});
    if(target[0].role==='manufacturer'&&target[0].company_status!=='verified')
      return reply(res,403,{error:'Approve the company before sponsoring its wallet'});
    const approval=await sql`INSERT INTO rb_sponsor_approvals(user_id,granted_by)
      VALUES (${id},${actor.id}) ON CONFLICT(user_id) DO NOTHING RETURNING user_id`;
    if(!approval.length)return reply(res,409,{error:'Sponsor eligibility has already been approved'});
    return reply(res,200,{ok:true,notice:'Wallet approved for one-time sponsor activation. This action does NOT transfer any test NEAR.'});
  }
  if(action==='verify_company'||action==='suspend_company'){
    const org=await sql`SELECT id,status FROM rb_organizations WHERE id=${id} LIMIT 1`;
    if(!org[0])return reply(res,404,{error:'Company not found'});
    const status=action==='verify_company'?'verified':'suspended';
    await sql.transaction([
      sql`UPDATE rb_organizations SET status=${status} WHERE id=${id}`,
      sql`INSERT INTO rb_admin_audit(actor_user_id,action,target_type,target_id,detail)
        VALUES (${actor.id},${action},'company',${id},${reason.slice(0,200)||null})`
    ]);
    return reply(res,200,{ok:true,status,notice:'Platform status changed only. NEAR contract manufacturer registration still requires an authorized onchain transaction.'});
  }
  if(action==='review_issue'){
    const status=String(payload.status||'');
    if(!['under_review','more_info','approved_repair','approved_replacement','declined'].includes(status))
      return reply(res,400,{error:'Invalid review status'});
    const found=await sql`SELECT id FROM rb_issue_reports WHERE id=${id} LIMIT 1`;
    if(!found[0])return reply(res,404,{error:'Issue not found'});
    await sql.transaction([
      sql`UPDATE rb_issue_reports SET status=${status},updated_at=now() WHERE id=${id}`,
      sql`INSERT INTO rb_admin_audit(actor_user_id,action,target_type,target_id,detail)
        VALUES (${actor.id},'review_issue','issue',${id},${status})`
    ]);
    return reply(res,200,{ok:true,status,notice:'Issue status updated. No payout was initiated.'});
  }
  return reply(res,404,{error:'Unknown action'});
 }catch(e){
  console.error('RB_ADMIN_ERR',{code:e?.code||'internal'});
  return reply(res,500,{error:'Admin request failed'});
 }
}
