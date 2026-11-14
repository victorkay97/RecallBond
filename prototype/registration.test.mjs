import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {newWalletIdentity,base58Encode,encryptWalletSecret,decryptWalletSecret,normalizeEmail,normalizePhone,validatePassword,hashPassword,verifyPassword,newSessionToken,sessionDigest} from './backend/auth-core.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('wallet creation makes different valid NEAR implicit identities',()=>{
 const a=newWalletIdentity(),b=newWalletIdentity();
 assert.match(a.accountId,/^[0-9a-f]{64}$/);
 assert.notEqual(a.accountId,b.accountId);
 assert.match(a.publicKey,/^ed25519:[1-9A-HJ-NP-Za-km-z]+$/);
 assert.match(a.secretKey,/^ed25519:[1-9A-HJ-NP-Za-km-z]+$/);
 assert.equal(base58Encode(Buffer.from([0,0,1])),'112');
});
test('wallet secret is AES-GCM encrypted and tampering is rejected',()=>{
 const key=randomBytes(32).toString('hex'),w=newWalletIdentity();
 const payload=encryptWalletSecret(w.secretKey,key);
 assert.doesNotMatch(payload,/ed25519|secretKey/);
 assert.equal(decryptWalletSecret(payload,key),w.secretKey);
 assert.throws(()=>decryptWalletSecret(payload,randomBytes(32).toString('hex')));
 assert.throws(()=>encryptWalletSecret(w.secretKey,'not-an-encryption-key'));
});
test('passwords use per-user salted scrypt and reject invalid login',async()=>{
 const a=await hashPassword('SufficientlyLongAndUnique!29');
 const b=await hashPassword('SufficientlyLongAndUnique!29');
 assert.notEqual(a,b);
 assert.equal(await verifyPassword('SufficientlyLongAndUnique!29',a),true);
 assert.equal(await verifyPassword('incorrect-one',a),false);
 assert.throws(()=>validatePassword('short'));
 assert.equal(normalizeEmail(' Test@Example.ORG '),'test@example.org');
 assert.throws(()=>normalizeEmail('oops'));
});
test('session tokens are random and hashed before database persistence',()=>{
 const a=newSessionToken(),b=newSessionToken();
 assert.notEqual(a,b);assert.match(a,/^[A-Za-z0-9_-]{43}$/);
 assert.match(sessionDigest(a),/^[0-9a-f]{64}$/);
 assert.notEqual(sessionDigest(a),a);
});
test('open signup collects phone and email without onchain activation',()=>{
 const html=read('account/index.html'),ui=read('account/account.mjs'),api=read('api/auth.js'),sql=read('backend/schema.sql');
 assert.match(html,/NEAR testnet/);
 assert.match(html,/awaiting NEAR testnet activation|not funded or activated/);
 assert.match(html,/account.mjs/);
 assert.match(ui,/api\('register'|register/);
 assert.match(api,/encrypted_secret/);
 assert.match(api,/email_verified_at/);
 assert.match(api,/normalizePhone\(form.phoneNumber\)/);
 assert.match(html,/name="phoneNumber"/);
 assert.equal(normalizePhone('08012345678'),'+2348012345678');
 assert.equal(normalizePhone('+234 801 234 5678'),'+2348012345678');
 assert.throws(()=>normalizePhone('123'));
 assert.match(api,/reserved/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS rb_users/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS rb_organizations/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS rb_issue_reports/);
 assert.doesNotMatch(ui,/privateKey|secretKey/);
});
test('all sample passport NFT fronts share the same cover image while flip QR stays intact',()=>{
 const html=read('app/index.html');
 const stages=html.match(/data-passport="RB-NV-00289[12]"/g)||[];
 assert.ok(stages.length>=3);
 assert.equal((html.match(/class="rb-passport-cover-image"/g)||[]).length,3);
 assert.equal((html.match(/class="qr-container" data-qr/g)||[]).length,3);
});
