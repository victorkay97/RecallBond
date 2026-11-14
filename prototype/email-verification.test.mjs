import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
test('email verification stores hashed and expiring codes only, checks account session and origin',()=>{
 const api=read('api/email.js'),schema=read('backend/verification.sql');
 assert.match(api,/createHmac/);
 assert.match(api,/randomInt\(0,1000000\)/);
 assert.match(api,/expires_at>now\(\)/);
 assert.match(api,/attempts<6/);
 assert.match(api,/rb_sessions/);
 assert.match(api,/checkOrigin\(req\)/);
 assert.match(api,/Zoho-enczapikey/);
 assert.match(api,/senderConfigured\(\)/);
 assert.doesNotMatch(api,/console\.log\(.*code/);
 assert.match(schema,/CREATE TABLE IF NOT EXISTS rb_email_verifications/);
 assert.match(schema,/code_hash text NOT NULL/);
});
test('optional email confirmation UI exists without gating demo onboarding',()=>{
 const page=read('account/index.html'),script=read('account/account.mjs');
 assert.match(page,/id="verify-form"/);
 assert.match(page,/autocomplete="one-time-code"/);
 assert.match(script,/emailAction\('request'\)/);
 assert.match(script,/emailAction\('confirm'/);
 assert.match(script,/user\.emailVerified/);
 assert.match(script,/user\.role!=='consumer'/);
 assert.match(script,/account-verify/);
});
