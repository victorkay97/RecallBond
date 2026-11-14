import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newWalletIdentity,encryptWalletSecret,decryptWalletSecret,base58Encode,
 normalizeEmail,normalizePhone,hashPassword,verifyPassword,validatePassword,newSessionToken,sessionDigest} from './backend/auth-core.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function decode58(str){
 let value=0n;
 for(const c of str){const digit=alphabet.indexOf(c);if(digit<0)throw Error('bad base58');value=value*58n+BigInt(digit);}
 let hex=value.toString(16);if(hex.length%2)hex='0'+hex;
 const decoded=value===0n?Buffer.alloc(0):Buffer.from(hex,'hex');
 return Buffer.concat([Buffer.alloc((str.match(/^1+/)||[''])[0].length),decoded]);
}
test('each automatic testnet wallet identity has a unique near implicit ID matching its key',()=>{
 const x=newWalletIdentity(),y=newWalletIdentity();
 assert.match(x.accountId,/^[0-9a-f]{64}$/);
 assert.notEqual(x.accountId,y.accountId);
 assert.equal(decode58(x.publicKey.slice(8)).toString('hex'),x.accountId);
 assert.equal(decode58(x.secretKey.slice(8)).length,64);
 assert.equal(decode58(x.secretKey.slice(8)).subarray(32).toString('hex'),x.accountId);
});
test('testnet signing secrets are encrypted at rest, tamper evident and not plain text',()=>{
 const original=newWalletIdentity().secretKey,key='a'.repeat(64),payload=encryptWalletSecret(original,key);
 assert.ok(payload.startsWith('v1.'));
 assert.ok(!payload.includes(original));
 assert.equal(decryptWalletSecret(payload,key),original);
 assert.throws(()=>decryptWalletSecret(payload,'b'.repeat(64)));
 assert.throws(()=>decryptWalletSecret(payload.slice(0,-2)+'xx',key));
 assert.throws(()=>encryptWalletSecret(original,'bad key'));
});
test('password hashing and verification are salt-based and timing-safe',async()=>{
 const hash=await hashPassword('a very long test password!');
 const hash2=await hashPassword('a very long test password!');
 assert.notEqual(hash,hash2);
 assert.ok(await verifyPassword('a very long test password!',hash));
 assert.equal(await verifyPassword('wrong password',hash),false);
 assert.equal(await verifyPassword('',hash),false);
 assert.throws(()=>validatePassword('short'));
});
test('sessions use random bearer values but only store SHA256 hashes',()=>{
 const a=newSessionToken(),b=newSessionToken();
 assert.notEqual(a,b);
 assert.match(a,/^[A-Za-z0-9_-]{43}$/);
 assert.match(sessionDigest(a),/^[0-9a-f]{64}$/);
 assert.notEqual(sessionDigest(a),a);
});
test('email normalization and account schema enforce core constraints',()=>{
 assert.equal(normalizeEmail('  Example.User@GMAIL.Com '),'example.user@gmail.com');
 assert.throws(()=>normalizeEmail('not an email'));
 assert.equal(normalizePhone('08012345678'),'+2348012345678');
 assert.equal(normalizePhone('+2348012345678'),'+2348012345678');
 const schema=read('./backend/schema.sql');
 assert.match(schema,/UNIQUE \(email\)/);
 assert.match(schema,/user_id uuid UNIQUE/);
 assert.match(schema,/encrypted_secret text NOT NULL/);
 assert.match(schema,/CREATE TABLE IF NOT EXISTS rb_sessions/);
 assert.match(schema,/CHECK \(status IN \('reserved','active','disabled'\)\)/);
});
test('real account API refuses unconfigured backend and never leaks private keys',()=>{
 const api=read('./api/auth.js');
 assert.match(api,/configReady\(\)/);
 assert.match(api,/reserved/);
 assert.match(api,/HttpOnly/);
 assert.ok(api.includes("target.protocol==='https:'"),'production account origin must use HTTPS');
 assert.match(api,/SameSite=Lax/);
 assert.match(api,/checkOrigin\(req\)/);
 assert.match(api,/hashPassword/);
 assert.match(api,/sql.transaction/);
 assert.match(api,/RB_WALLET_MASTER_KEY/);
 assert.match(api,/get_credit|rb_issue_reports/);
 assert.doesNotMatch(api,/secretKey:identity.secretKey/);
});
test('every sample passport has minimalist cover and keeps QR flip',()=>{
 const html=read('./app/index.html');
 assert.equal((html.match(/rb-passport-cover-image/g)||[]).length,3);
 assert.equal((html.match(/data-qr/g)||[]).length,3);
 assert.match(html,/data-passport="RB-NV-002892"/);
 assert.match(html,/passport-back/);
});
test('account screen does not claim real chain activation prior to funding',()=>{
 const html=read('./account/index.html');
 assert.match(html,/reserved/i);
 assert.match(html,/not funded or activated/i);
 assert.match(html,/id="account-form"/);
 assert.match(html,/id="account-role"/);
 const js=read('./account/account.mjs');
 assert.match(js,/api\('health'\)/);
 assert.match(js,/ready=false/);
 assert.match(js,/backend-state/);
 assert.match(js,/submit.disabled=true/);
});
