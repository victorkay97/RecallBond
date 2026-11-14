// Vercel same-origin API: persistent consumer/manufacturer account registration.
// Wallets here are reserved ED25519 NEAR testnet implicit addresses, NOT funded onchain accounts.
// Requires DATABASE_URL and RB_WALLET_MASTER_KEY in encrypted server configuration.
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { JsonRpcProvider } from 'near-api-js';
import { normalizeEmail, validatePassword, hashPassword, verifyPassword, safeCompanyName,
  newWalletIdentity, encryptWalletSecret, newSessionToken, sessionDigest } from '../backend/auth-core.mjs';

const json=(res,status,data)=>{
  res.statusCode=status;
  res.setHeader('Cache-Control','no-store, private');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(data));
};
const cookieName=req=>String(req.headers.host||'').startsWith('localhost')?'rb_session':'__Host-rb_session';
function getToken(req){
  const prefix=cookieName(req)+'=';
  const part=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(prefix));
  return part?part.slice(prefix.length):null;
}
function sessionCookie(req,token,maxAge){
  const secure=cookieName(req).startsWith('__Host-')?'; Secure':'';
  return cookieName(req)+'='+token+'; Path=/; HttpOnly; SameSite=Lax'+secure+'; Max-Age='+maxAge;
}
function checkOrigin(req){
  const origin=req.headers.origin;
  const host=req.headers.host;
  if(!origin||!host)return false;
  try{const target=new URL(origin);const local=['localhost','127.0.0.1'].includes(target.hostname);return target.host===host&&(target.protocol==='https:'||(local&&target.protocol==='http:'));}
  catch{return false;}
}
function readBody(req){
  const input=req.body;
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid request body');
  if(Buffer.byteLength(JSON.stringify(input))>8192)throw Error('Request exceeds allowed size');
  return input;
}
async function member(sql,req){
  const token=getToken(req);
  if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  const rows=await sql`SELECT u.id,u.email,u.role,u.email_verified_at,u.created_at,
      w.near_account_id,w.public_key,w.status AS wallet_status,w.network,
      o.id AS org_id,o.name AS company_name,o.status AS company_status
    FROM rb_sessions s JOIN rb_users u ON u.id=s.user_id
    LEFT JOIN rb_wallets w ON w.user_id=u.id
    LEFT JOIN rb_organizations o ON o.owner_user_id=u.id
    WHERE s.token_hash=${sessionDigest(token)}
      AND s.revoked_at IS NULL AND s.expires_at>now() AND u.suspended_at IS NULL
    LIMIT 1`;
  return rows[0]||null;
}
function publicUser(u){
  return {id:u.id,email:u.email,role:u.role,emailVerified:Boolean(u.email_verified_at),
    wallet:u.near_account_id?{accountId:u.near_account_id,publicKey:u.public_key,status:u.wallet_status,network:u.network}:null,
    organization:u.org_id?{id:u.org_id,name:u.company_name,status:u.company_status}:null};
}
async function createSession(sql,req,res,userId){
  const token=newSessionToken();
  await sql`INSERT INTO rb_sessions (id,user_id,token_hash,expires_at)
    VALUES (${randomUUID()},${userId},${sessionDigest(token)},now()+interval '7 days')`;
  res.setHeader('Set-Cookie',sessionCookie(req,token,604800));
}
function configReady(){return Boolean(process.env.DATABASE_URL)&&/^[0-9a-f]{64}$/i.test(process.env.RB_WALLET_MASTER_KEY||'');}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, private');
  const url=new URL(req.url,'https://'+String(req.headers.host||'localhost'));
  const action=url.searchParams.get('action')||'health';
  if(req.method==='OPTIONS'){res.setHeader('Allow','GET, POST');return json(res,405,{error:'Unsupported method'});}
  if(action==='health'&&req.method==='GET'){
    if(!configReady())return json(res,503,{ready:false,reason:'Database or wallet vault not configured'});
    try{
      const sql=neon(process.env.DATABASE_URL);
      const state=await sql`SELECT to_regclass('public.rb_users')::text AS name`;
      return json(res,state[0]?.name?200:503,{ready:Boolean(state[0]?.name)});
    }catch{return json(res,503,{ready:false,reason:'Database unavailable'});}
  }
  if(!configReady())return json(res,503,{error:'Account registration is not activated yet. Please use the labeled demo.'});
  if(req.method==='POST'&&!checkOrigin(req))return json(res,403,{error:'Invalid request origin'});
  const sql=neon(process.env.DATABASE_URL);
  try{
    if(action==='register'&&req.method==='POST'){
      const form=readBody(req),email=normalizeEmail(form.email),password=validatePassword(form.password);
      const role=form.role==='manufacturer'?'manufacturer':form.role==='consumer'?'consumer':null;
      if(!role)return json(res,400,{error:'Choose consumer or manufacturer'});
      const companyName=role==='manufacturer'?safeCompanyName(form.companyName):null;
      // Per-address and per-email limits prevent anonymous registration flooding.
      // IP is hashed; never persist the raw address.
      const addr=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
      const ipHash=sessionDigest('signup:'+addr);
      const emailHash=sessionDigest('signup-email:'+email);
      const recent=await sql`SELECT COUNT(*)::int AS count FROM rb_login_attempts
        WHERE identifier_hash IN (${ipHash},${emailHash})
          AND attempted_at>now()-interval '1 hour'`;
      if(recent[0].count>=8)return json(res,429,{error:'Too many signup attempts. Try again later.'});
      await sql`INSERT INTO rb_login_attempts(identifier_hash,successful)
        VALUES (${ipHash},false),(${emailHash},false)`;
      // Encrypt the key BEFORE database work; if vault is missing or malformed, fail without creating a user.
      const identity=newWalletIdentity();
      const encrypted=encryptWalletSecret(identity.secretKey,process.env.RB_WALLET_MASTER_KEY);
      const hash=await hashPassword(password);
      const userId=randomUUID();
      const inserts=[
        sql`INSERT INTO rb_users (id,email,password_hash,role)
          VALUES (${userId},${email},${hash},${role})`,
        sql`INSERT INTO rb_wallets (id,user_id,near_account_id,public_key,encrypted_secret,status,network)
          VALUES (${randomUUID()},${userId},${identity.accountId},${identity.publicKey},${encrypted},'reserved','testnet')`,
      ];
      if(role==='manufacturer')inserts.push(sql`INSERT INTO rb_organizations(id,owner_user_id,name,status)
          VALUES (${randomUUID()},${userId},${companyName},'unverified')`);
      try{await sql.transaction(inserts,{isolationMode:'Serializable'});}
      catch(e){
        if(e?.code==='23505'||String(e?.message||'').includes('duplicate key'))return json(res,409,{error:'An account already exists for this email'});
        throw e;
      }
      await createSession(sql,req,res,userId);
      const u=await sql`SELECT u.id,u.email,u.role,u.email_verified_at,
        w.near_account_id,w.public_key,w.status AS wallet_status,w.network,
        o.id AS org_id,o.name AS company_name,o.status AS company_status
        FROM rb_users u LEFT JOIN rb_wallets w ON w.user_id=u.id
        LEFT JOIN rb_organizations o ON o.owner_user_id=u.id WHERE u.id=${userId}`;
      return json(res,201,{user:publicUser(u[0]),notice:'Your NEAR testnet address has been reserved. It is not active until funded onchain. Email verification and recovery are still pending.'});
    }
    if(action==='login'&&req.method==='POST'){
      const body=readBody(req),email=normalizeEmail(body.email);
      const attempts=await sql`SELECT COUNT(*)::int AS count FROM rb_login_attempts WHERE
        identifier_hash=${sessionDigest(email)} AND attempted_at>now()-interval '15 minutes' AND successful=false`;
      if(attempts[0].count>=8)return json(res,429,{error:'Too many attempts. Try again later.'});
      const u=await sql`SELECT id,password_hash FROM rb_users WHERE email=${email} AND suspended_at IS NULL LIMIT 1`;
      const valid=u[0]&&await verifyPassword(body.password,u[0].password_hash);
      if(!valid){
        await sql`INSERT INTO rb_login_attempts(identifier_hash,successful) VALUES(${sessionDigest(email)},false)`;
        return json(res,401,{error:'Incorrect email or password'});
      }
      await sql`DELETE FROM rb_login_attempts WHERE identifier_hash=${sessionDigest(email)}`;
      await createSession(sql,req,res,u[0].id);
      // New session is set in the response, so query the registered user directly.
      const person=await sql`SELECT u.id,u.email,u.role,u.email_verified_at,
        w.near_account_id,w.public_key,w.status AS wallet_status,w.network,
        o.id AS org_id,o.name AS company_name,o.status AS company_status
        FROM rb_users u LEFT JOIN rb_wallets w ON w.user_id=u.id
        LEFT JOIN rb_organizations o ON o.owner_user_id=u.id WHERE u.id=${u[0].id}`;
      return json(res,200,{user:publicUser(person[0])});
    }
    if(action==='logout'&&req.method==='POST'){
      const token=getToken(req);
      if(token)await sql`UPDATE rb_sessions SET revoked_at=now() WHERE token_hash=${sessionDigest(token)}`;
      res.setHeader('Set-Cookie',sessionCookie(req,'',0));
      return json(res,200,{ok:true});
    }
    if(req.method!=='GET'&&req.method!=='POST')return json(res,405,{error:'Unsupported method'});
    const u=await member(sql,req);
    if(!u)return json(res,401,{error:'Sign in required'});
    if(action==='me'&&req.method==='GET')return json(res,200,{user:publicUser(u)});
    if(action==='issues'&&req.method==='GET'){
      if(u.role==='consumer'){
        const rows=await sql`SELECT id,token_id,category,description,status,created_at,updated_at
          FROM rb_issue_reports WHERE consumer_user_id=${u.id} ORDER BY created_at DESC LIMIT 100`;
        return json(res,200,{issues:rows});
      }
      // A new company must be verified AND explicitly associated with a real product before issues are routed.
      if(u.company_status!=='verified')return json(res,200,{issues:[],notice:'Organization verification required for manufacturer issue inbox.'});
      const rows=await sql`SELECT id,token_id,category,description,status,created_at,updated_at
        FROM rb_issue_reports WHERE organization_id=${u.org_id} ORDER BY created_at DESC LIMIT 100`;
      return json(res,200,{issues:rows});
    }
    if(action==='issues'&&req.method==='POST'){
      if(u.role!=='consumer')return json(res,403,{error:'Only consumer accounts can report issues'});
      if(!u.email_verified_at)return json(res,403,{error:'Verify your email before submitting real support reports'});
      const body=readBody(req),tokenId=String(body.tokenId||'').trim().toUpperCase(),
        category=String(body.category||''),description=String(body.description||'').trim();
      if(!/^[A-Z0-9][A-Z0-9_-]{3,63}$/.test(tokenId))return json(res,400,{error:'Invalid passport ID'});
      if(!['battery','screen','charging','software','other'].includes(category))return json(res,400,{error:'Choose a valid issue category'});
      if(description.length<15||description.length>2000)return json(res,400,{error:'Description must contain 15 to 2000 characters'});
      const indexed=await sql`SELECT organization_id FROM rb_onchain_products
        WHERE token_id=${tokenId} AND status='confirmed' LIMIT 1`;
      if(!indexed.length)return json(res,400,{error:'This passport was not issued through your RecallBond manufacturer workspace'});
      // Public chain ownership is authoritative; do not trust a passport ID typed by a user.
      const wallet=await sql`SELECT near_account_id FROM rb_wallets WHERE user_id=${u.id} LIMIT 1`;
      const provider=new JsonRpcProvider({url:'https://test.rpc.fastnear.com'});
      const proof=await provider.callFunction({contractId:'rb-vk97-261112.testnet',
        method:'get_product',args:{token_id:tokenId}});
      if(!proof||proof.owner_id!==wallet[0]?.near_account_id)
        return json(res,403,{error:'Only the current onchain passport owner can report a device issue'});
      const id=randomUUID();
      await sql`INSERT INTO rb_issue_reports(id,consumer_user_id,token_id,category,description,status,organization_id)
         VALUES (${id},${u.id},${tokenId},${category},${description},'submitted',${indexed[0].organization_id})`;
      return json(res,201,{id,status:'submitted',notice:'Saved and routed to the issuing manufacturer. Support review is not a guaranteed payout.'});
    }
    return json(res,404,{error:'Unknown action'});
  }catch(err){
    // Never reveal DATABASE_URL, internal errors or secret material in API responses.
    if(String(err?.message||'').includes('password')||String(err?.message||'').includes('email')||String(err?.message||'').includes('Company name'))
      return json(res,400,{error:err.message});
    return json(res,500,{error:'Request failed. Please retry or contact support.'});
  }
}
