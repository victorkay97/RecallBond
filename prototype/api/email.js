// RecallBond email verification. Only works with a configured transactional sender.
// Password auth session is required; no token or raw code is returned to the browser.
import {randomInt,createHmac} from 'node:crypto';
import {neon} from '@neondatabase/serverless';
import {sessionDigest} from '../backend/auth-core.mjs';

const cookie='__Host-rb_session';
function json(res,code,data){res.setHeader('Cache-Control','no-store, private');res.setHeader('Content-Type','application/json');res.status(code).json(data);}
function tokenFrom(req){return (String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookie+'='))||'').slice(cookie.length+1);}
function checkOrigin(req){
 try{const url=new URL(String(req.headers.origin||''));return url.protocol==='https:'&&url.host===req.headers.host;}
 catch{return false;}
}
function hashCode(userId,code){
 return createHmac('sha256',process.env.RB_WALLET_MASTER_KEY).update(userId+':email:'+code).digest('hex');
}
function senderConfigured(){
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.RB_MAIL_FROM||'')
   && Boolean(process.env.RB_ZEPTO_SEND_API_KEY)&&Boolean(process.env.RB_WALLET_MASTER_KEY);
}
async function sendMessage(recipient,code){
 const text='Your RecallBond email verification code is '+code+'. It expires in 10 minutes. If you did not register, ignore this message.';
 const resp=await fetch('https://api.zeptomail.com/v1.1/email',{
  method:'POST',headers:{
    'Content-Type':'application/json','Accept':'application/json',
    'Authorization':'Zoho-enczapikey '+String(process.env.RB_ZEPTO_SEND_API_KEY||'').trim().replace(/^Zoho-enczapikey\\s+/i,'')
  },
  body:JSON.stringify({
   from:{address:process.env.RB_MAIL_FROM,name:'RecallBond'},
   to:[{email_address:{address:recipient,name:'RecallBond user'}}],
   subject:'Verify your RecallBond email address',
   htmlbody:'<div style="font-family:Arial,sans-serif;color:#14221a"><h2>Verify your RecallBond account</h2><p>Enter this code in your account:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">'+code+'</p><p>This code expires in 10 minutes. Never share it.</p></div>',
   textbody:text
  })
 });
 if(!resp.ok)throw Error('Email delivery unavailable');
}
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Use POST'});
 if(!checkOrigin(req))return json(res,403,{error:'Invalid request origin'});
 if(!process.env.DATABASE_URL||!process.env.RB_WALLET_MASTER_KEY)return json(res,503,{error:'Account verification is not configured'});
 if(!['application/json'].includes(String(req.headers['content-type']||'').split(';')[0]))return json(res,415,{error:'Use application/json'});
 const sid=tokenFrom(req);
 if(!/^[A-Za-z0-9_-]{43}$/.test(sid))return json(res,401,{error:'Sign in required'});
 const sql=neon(process.env.DATABASE_URL);
 const who=await sql`SELECT u.id,u.email,u.email_verified_at
 FROM rb_sessions s JOIN rb_users u ON u.id=s.user_id
 WHERE s.token_hash=${sessionDigest(sid)} AND s.revoked_at IS NULL AND s.expires_at>now() LIMIT 1`;
 if(!who[0])return json(res,401,{error:'Sign in required'});
 const user=who[0];
 if(user.email_verified_at)return json(res,200,{verified:true});
 const action=String(req.query.action||'');
 if(action==='request'){
  if(!senderConfigured())return json(res,503,{error:'Email verification requires a configured sender. The account remains unverified.'});
  const code=String(randomInt(0,1000000)).padStart(6,'0');
  const hash=hashCode(user.id,code);
  const rows=await sql`INSERT INTO rb_email_verifications(user_id,code_hash,expires_at,last_sent_at,sent_count,attempts)
   VALUES (${user.id},${hash},now()+interval '10 minutes',now(),1,0)
   ON CONFLICT(user_id) DO UPDATE SET
     code_hash=EXCLUDED.code_hash,expires_at=EXCLUDED.expires_at,
     attempts=0,last_sent_at=now(),
     sent_count=CASE WHEN rb_email_verifications.last_sent_at<now()-interval '1 hour'
       THEN 1 ELSE rb_email_verifications.sent_count+1 END
   WHERE rb_email_verifications.last_sent_at<now()-interval '90 seconds'
     AND (rb_email_verifications.sent_count<5 OR rb_email_verifications.last_sent_at<now()-interval '1 hour')
   RETURNING user_id`;
  if(rows.length===0)return json(res,429,{error:'Please wait before requesting another code.'});
  try{await sendMessage(user.email,code);}
  catch{
    // This attempt is invalidated if mail cannot be submitted.
    await sql`DELETE FROM rb_email_verifications WHERE user_id=${user.id} AND code_hash=${hash}`;
    return json(res,503,{error:'Unable to send verification email. Try again later.'});
  }
  return json(res,200,{sent:true,notice:'Verification code sent to your registered email.'});
 }
 if(action==='confirm'){
  const code=typeof req.body?.code==='string'?req.body.code:'';
  if(!/^\d{6}$/.test(code))return json(res,400,{error:'Enter the six-digit code'});
  const hash=hashCode(user.id,code);
  const match=await sql`DELETE FROM rb_email_verifications
    WHERE user_id=${user.id} AND code_hash=${hash}
    AND expires_at>now() AND attempts<6 RETURNING user_id`;
  if(!match.length){
    await sql`UPDATE rb_email_verifications SET attempts=attempts+1 WHERE user_id=${user.id} AND expires_at>now()`;
    return json(res,400,{error:'Incorrect or expired code'});
  }
  await sql`UPDATE rb_users SET email_verified_at=now() WHERE id=${user.id} AND email_verified_at IS NULL`;
  return json(res,200,{verified:true,notice:'Email confirmed. Your account is verified; NEAR wallet activation is separate.'});
 }
 return json(res,404,{error:'Unknown verification action'});
}
