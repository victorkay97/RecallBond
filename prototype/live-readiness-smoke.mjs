// Safe live smoke: tests public API boundaries and optional authenticated reads.
// It never mints, transfers, claims, pays out, activates wallets or exposes credentials.
// Run: RB_SMOKE_BASE_URL=https://recallbond.vercel.app npm run test:live
import assert from 'node:assert/strict';

const base=(process.env.RB_SMOKE_BASE_URL||'https://recallbond.vercel.app').replace(/\/$/,'');
const url=new URL(base);
assert.ok(url.protocol==='https:' || (url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)),
 'Live smoke requires HTTPS (except local development)');
const checks=[];
const timeout=Number(process.env.RB_SMOKE_TIMEOUT_MS||25000);

async function send(path,{method='GET',body,cookie,origin=true}={}){
 const headers={'Accept':'application/json'};
 if(body!==undefined) headers['Content-Type']='application/json';
 if(cookie) headers.Cookie=cookie;
 if(method!=='GET'&&origin) headers.Origin=base;
 const response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),
  redirect:'manual',signal:AbortSignal.timeout(timeout)});
 let data={};
 try{data=await response.json();}catch{}
 return {response,data};
}
function passed(message){checks.push(message);console.log('PASS:',message)}
async function expectStatus(path,status,opts={}){
 const r=await send(path,opts);
 assert.equal(r.response.status,status,`${path}: expected ${status}, got ${r.response.status} (${r.data.error||'no response body'})`);
 passed(path+' returns HTTP '+status);
 return r;
}
async function signin(role){
 const email=process.env['RB_SMOKE_'+role.toUpperCase()+'_EMAIL'];
 const password=process.env['RB_SMOKE_'+role.toUpperCase()+'_PASSWORD'];
 if(!email&&!password)return null;
 assert.ok(email&&password,'Both '+role+' smoke credential variables are required');
 const {response,data}=await send('/api/auth?action=login',{method:'POST',body:{email,password}});
 assert.equal(response.status,200,role+' sign-in must work');
 assert.equal(data.user?.role,role,role+' session role must match');
 // Parse only the first session cookie. Never log or persist its value.
 const cookie=(response.headers.get('set-cookie')||'').split(';')[0];
 assert.match(cookie,/^(?:__Host-)?rb_session=[A-Za-z0-9_-]{43}$/,'secure session must be issued');
 passed(role+' session established');
 return {cookie,user:data.user};
}
async function verifyWallet(role,session){
 assert.equal(session.user.emailVerified,true,role+' email must be verified');
 assert.equal(session.user.wallet?.status,'active',role+' wallet must be activated');
 const {response,data}=await send('/api/wallet?action=status',{cookie:session.cookie});
 assert.equal(response.status,200,role+' wallet status must be readable');
 assert.equal(data.status,'active',role+' wallet must be active on testnet');
 passed(role+' verified account and active wallet');
}
async function main(){
 const health=await expectStatus('/api/auth?action=health',200);
 assert.equal(health.data.ready,true,'database health must be ready');
 for(const page of ['/','/verify/','/account/','/studio/','/admin/']){
  const r=await fetch(base+page,{redirect:'manual',signal:AbortSignal.timeout(timeout)});
  assert.equal(r.status,200,page+' must be deployed');
  passed(page+' loads');
 }
 await expectStatus('/api/auth?action=me',401);
 await expectStatus('/api/wallet?action=status',401);
 await expectStatus('/api/chain?action=portfolio',401);
 await expectStatus('/api/admin?action=overview',403);
 // Email endpoint cannot be called cross-site or without a session.
 await expectStatus('/api/email?action=request',403,{method:'POST',body:{},origin:false});

 const consumer=await signin('consumer');
 if(consumer){
  await verifyWallet('consumer',consumer);
  const portfolio=await send('/api/chain?action=portfolio',{cookie:consumer.cookie});
  assert.equal(portfolio.response.status,200,'consumer portfolio must be readable from contract');
  assert.ok(Array.isArray(portfolio.data.products));
  passed('consumer onchain portfolio is readable');
 }
 const manufacturer=await signin('manufacturer');
 if(manufacturer){
  await verifyWallet('manufacturer',manufacturer);
  assert.equal(manufacturer.user.organization?.status,'verified','manufacturer organization must be approved');
  const business=await send('/api/chain?action=manufacturer',{cookie:manufacturer.cookie});
  assert.equal(business.response.status,200,'manufacturer workspace must load real records');
  assert.ok(Array.isArray(business.data.products));
  passed('verified manufacturer workspace is readable');
 }
 const adminEmail=process.env.RB_SMOKE_ADMIN_EMAIL;
 const adminPassword=process.env.RB_SMOKE_ADMIN_PASSWORD;
 if(adminEmail||adminPassword){
  assert.ok(adminEmail&&adminPassword,'Provide both admin credential variables');
  const {response,data}=await send('/api/auth?action=login',{method:'POST',body:{email:adminEmail,password:adminPassword}});
  assert.equal(response.status,200,'admin must sign in');
  const cookie=(response.headers.get('set-cookie')||'').split(';')[0];
  const dashboard=await send('/api/admin?action=overview',{cookie});
  assert.equal(dashboard.response.status,200,'admin must access restricted metrics');
  assert.ok(dashboard.data.metrics);
  passed('verified admin metrics are readable');
 }
 if(!consumer||!manufacturer||!adminEmail)
  console.log('NOTE: credentialed consumer/manufacturer/admin checks were skipped where env vars are absent.');
 console.log('PASS: '+checks.length+' live smoke checks. No NEAR transactions were submitted.');
}
main().catch(err=>{console.error('FAIL: live readiness smoke:',err.message);process.exitCode=1;});
