import test from 'node:test';
import assert from 'node:assert/strict';
import {RecallBondLedger} from './ledger.mjs';
function funded(){
 const l=new RecallBondLedger();
 l.addProduct({id:'NV-001',batch:'BAT-X21',owner:'ada.testnet'});
 l.addProduct({id:'NV-002',batch:'BAT-X21',owner:'sara.testnet',serialHash:'b'.repeat(64)});
 const id=l.createCampaign({batch:'BAT-X21',payout:100});
 l.fundCampaign({id,amount:200});l.activateCampaign(id);return {l,id};
}
test('passport follows ownership transfer',()=>{const {l}=funded();l.transfer({id:'NV-001',from:'ada.testnet',to:'tomi.testnet'});assert.equal(l.products.get('NV-001').owner,'tomi.testnet');});
test('former owner cannot claim',()=>{const {l,id}=funded();l.transfer({id:'NV-001',from:'ada.testnet',to:'tomi.testnet'});assert.throws(()=>l.claim({id,token:'NV-001',caller:'ada.testnet'}),/current passport holder/);});
test('new owner gets fixed claim credit',()=>{const {l,id}=funded();l.transfer({id:'NV-001',from:'ada.testnet',to:'tomi.testnet'});l.claim({id,token:'NV-001',caller:'tomi.testnet'});l.transfer({id:'NV-001',from:'tomi.testnet',to:'ada.testnet'});assert.equal(l.credits.get('tomi.testnet'),100);});
test('duplicate claim rejected',()=>{const {l,id}=funded();l.claim({id,token:'NV-001',caller:'ada.testnet'});assert.throws(()=>l.claim({id,token:'NV-001',caller:'ada.testnet'}),/already claimed/);});
test('unrelated product not eligible',()=>{const {l,id}=funded();l.addProduct({id:'OTHER',batch:'OTHER',owner:'ada.testnet',serialHash:'c'.repeat(64)});assert.throws(()=>l.claim({id,token:'OTHER',caller:'ada.testnet'}),/not eligible/);});
test('full funding required',()=>{const l=new RecallBondLedger();l.addProduct({id:'NV-001',batch:'X',owner:'ada.testnet'});const id=l.createCampaign({batch:'X',payout:100});l.fundCampaign({id,amount:50});assert.throws(()=>l.activateCampaign(id),/Full reserve/);});
test('batch frozen when campaign created',()=>{const {l}=funded();assert.throws(()=>l.addProduct({id:'NV-003',batch:'BAT-X21',owner:'ada.testnet',serialHash:'d'.repeat(64)}),/Batch frozen/);});
test('cannot overfund',()=>{const {l,id}=funded();assert.throws(()=>l.fundCampaign({id,amount:1}),/Not accepting funding/);});
test('reserve accounting',()=>{const {l,id}=funded();l.claim({id,token:'NV-001',caller:'ada.testnet'});assert.equal(l.getCampaign(id).funded+l.credits.get('ada.testnet'),200);});
test('double withdrawal rejected',()=>{const {l,id}=funded();l.claim({id,token:'NV-001',caller:'ada.testnet'});assert.equal(l.withdraw('ada.testnet'),100);assert.throws(()=>l.withdraw('ada.testnet'),/Nothing to withdraw/);});
test('duplicate product rejected',()=>{const {l}=funded();assert.throws(()=>l.addProduct({id:'NV-001',batch:'X',owner:'ada.testnet',serialHash:'d'.repeat(64)}),/Duplicate product/);});
test('duplicate issuer serial rejected',()=>{const l=new RecallBondLedger();l.addProduct({id:'first',batch:'X',owner:'ada.testnet',serialHash:'f'.repeat(64)});assert.throws(()=>l.addProduct({id:'second',batch:'X',owner:'tomi.testnet',serialHash:'f'.repeat(64)}),/Duplicate manufacturer serial/);});
