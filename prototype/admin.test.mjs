import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
test('admin membership must be explicit and API enforces secure sessions',()=>{
 const sql=read('backend/admin.sql'),api=read('api/admin.js');
 assert.match(sql,/CREATE TABLE IF NOT EXISTS rb_admin_memberships/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS rb_admin_audit/);
 assert.match(sql,/ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS suspended_at/);
 assert.match(api,/JOIN rb_admin_memberships/);
 assert.match(api,/JOIN rb_admin_memberships/);
 assert.match(api,/approve_sponsor/);
 assert.match(api,/u\.suspended_at IS NULL/);
 assert.match(api,/s\.revoked_at IS NULL/);
 assert.match(api,/sameOrigin\(req\)/);
 assert.match(api,/Cannot change your own access/);
 assert.match(api,/Administrator accounts require manual security review/);
 assert.match(api,/sql\.transaction/);
 assert.doesNotMatch(api,/RB_ADMIN_PASSWORD|admin123|default_admin_key/);
});
test('suspensions affect both login and session authorization',()=>{
 const api=read('api/auth.js');
 assert.match(api,/u\.suspended_at IS NULL/);
 assert.match(api,/AND suspended_at IS NULL LIMIT 1/);
});
test('admin UI uses sprite icons and never prints fake numeric statistics',()=>{
 const html=read('admin/index.html'),js=read('admin/admin.mjs');
 assert.match(html,/mingcute\.svg#home/);
 assert.match(html,/mingcute\.svg#wallet/);
 assert.match(html,/mingcute\.svg#box/);
 assert.match(html,/mingcute\.svg#shield/);
 assert.match(html,/id="stats"/);
 assert.match(js,/textContent/);
 assert.match(js,/api\/admin\?action=/);
 assert.match(js,/data\.metrics|const m=d\.metrics/);
 assert.match(js,/confirm\(/);
 assert.doesNotMatch(js,/innerHTML\s*=/);
});
