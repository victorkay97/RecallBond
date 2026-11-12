import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, loadCases, submitCase, transitionCase, availableTransitions, clearCases } from './claims/model.mjs';
function store() {
  const map = new Map();
  return { getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
}
let counter = 0;
const now = () => '2026-11-12T08:00:00.000Z';
const idFactory = () => 'test-identifier-' + (++counter);
const good = {
  passportId:'RB-NV-002892', category:'display',
  description:'A vertical green line appeared on the screen despite normal use.',
  observedAt:'2026-11-11',
};
test('submits a fictional defect case tied to a known passport, without private or financial data',()=>{
  const storage=store();
  const entry=submitCase(storage,good,{now,idFactory});
  assert.match(entry.id,/^RB-CASE-/);
  assert.equal(entry.status,'submitted');
  assert.equal(loadCases(storage)[0].passportId,'RB-NV-002892');
  assert.equal(entry.history.length,1);
  assert.ok(!JSON.stringify(entry).includes('imei'));
  assert.ok(!JSON.stringify(entry).includes('credit'));
});
test('rejects unknown passports, categories and inadequate descriptions',()=>{
  const storage=store();
  assert.throws(()=>submitCase(storage,{...good,passportId:'GUESS'}, {now,idFactory}),/passport/);
  assert.throws(()=>submitCase(storage,{...good,category:'cash'}, {now,idFactory}),/category/);
  assert.throws(()=>submitCase(storage,{...good,description:'broken'}, {now,idFactory}),/12/);
  assert.deepEqual(loadCases(storage),[]);
});
test('manufacturer can request more information, then reopen for review',()=>{
  const storage=store(), entry=submitCase(storage,good,{now,idFactory});
  let changed=transitionCase(storage,entry.id,'needs_information','Please provide purchase evidence.',{now});
  assert.equal(changed.status,'needs_information');
  assert.deepEqual(availableTransitions('needs_information'),['under_review','declined']);
  changed=transitionCase(storage,entry.id,'under_review','Received additional information.',{now});
  assert.equal(changed.history.length,3);
});
test('repair, replacement and decline decisions are final; they never imply a payout',()=>{
  for(const ending of ['repair_approved','replacement_approved','declined']) {
    const storage=store(), entry=submitCase(storage,good,{now,idFactory});
    transitionCase(storage,entry.id,'under_review','Review started.',{now});
    assert.throws(()=>transitionCase(storage,entry.id,ending,'x',{now}),ending==='declined'?/8 characters/:/./);
    const decision=transitionCase(storage,entry.id,ending,'Reviewed against example warranty terms.',{now});
    assert.deepEqual(availableTransitions(decision.status),[]);
    assert.throws(()=>transitionCase(storage,entry.id,'under_review','reopen',{now}),/not permitted/);
    assert.ok(!('credit' in decision));
  }
});
test('cannot skip transitions, repeat statuses, or write unauthorized changes',()=>{
  const storage=store(), entry=submitCase(storage,good,{now,idFactory});
  assert.throws(()=>transitionCase(storage,entry.id,'submitted','repeat',{now}),/not permitted/);
  assert.throws(()=>transitionCase(storage,entry.id,'paid','x',{now}),/Unknown/);
  assert.throws(()=>transitionCase(storage,'RB-CASE-does-not-exist','declined','reject',{now}),/not found/);
});
test('corrupt stored cases are filtered, browser demo can be cleared',()=>{
  const storage=store();
  storage.setItem(STORAGE_KEY,'{invalid json');
  assert.deepEqual(loadCases(storage),[]);
  storage.setItem(STORAGE_KEY,JSON.stringify([{id:'RB-CASE-fakecase1',passportId:'UNKNOWN',status:'submitted',description:'example',category:'display',createdAt:now()}]));
  assert.deepEqual(loadCases(storage),[]);
  const entry=submitCase(storage,good,{now,idFactory});
  assert.equal(loadCases(storage).length,1);
  clearCases(storage);assert.deepEqual(loadCases(storage),[]);
  assert.ok(entry.id);
});
test('storage failure returns an actionable error without pretending a report was submitted',()=>{
  const storage={getItem:()=>null,setItem:()=>{throw new Error('blocked')},removeItem:()=>{}};
  assert.throws(()=>submitCase(storage,good,{now,idFactory}),/not saved/);
});
