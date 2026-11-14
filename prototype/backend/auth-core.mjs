// Reusable testnet-only account cryptography. No browser dependencies.
// NEAR ED25519 implicit account ID = lowercase hex of raw 32-byte public key.
import { randomBytes, generateKeyPairSync, createCipheriv, createDecipheriv, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scryptAsync=promisify(scrypt);
const B58='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function base58Encode(bytes) {
  const b=Buffer.from(bytes);
  let value=BigInt('0x'+(b.toString('hex')||'0')),out='';
  while(value>0n){const digit=Number(value%58n);out=B58[digit]+out;value/=58n;}
  for(const n of b){if(n!==0)break;out='1'+out;}
  return out||'1';
}
export function newWalletIdentity(){
  const {publicKey,privateKey}=generateKeyPairSync('ed25519');
  const pub=publicKey.export({format:'der',type:'spki'}).subarray(-32);
  const seed=privateKey.export({format:'der',type:'pkcs8'}).subarray(-32);
  if(pub.length!==32||seed.length!==32)throw Error('Cannot derive NEAR Ed25519 keys');
  return {accountId:pub.toString('hex'),publicKey:'ed25519:'+base58Encode(pub),secretKey:'ed25519:'+base58Encode(Buffer.concat([seed,pub]))};
}
function masterKey(value){
  if(typeof value!=='string'||!/^[0-9a-f]{64}$/i.test(value))throw Error('Wallet encryption configuration missing');
  return Buffer.from(value,'hex');
}
export function encryptWalletSecret(secret,keyHex){
  const iv=randomBytes(12),key=masterKey(keyHex);
  const cipher=createCipheriv('aes-256-gcm',key,iv);
  cipher.setAAD(Buffer.from('RecallBond:testnet-wallet:v1'));
  const ciphertext=Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]);
  return ['v1',iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),ciphertext.toString('base64url')].join('.');
}
export function decryptWalletSecret(encoded,keyHex){
  const [version,iv,tag,data,...more]=String(encoded).split('.');
  if(version!=='v1'||more.length||!iv||!tag||!data)throw Error('Invalid encrypted wallet payload');
  const decipher=createDecipheriv('aes-256-gcm',masterKey(keyHex),Buffer.from(iv,'base64url'));
  decipher.setAAD(Buffer.from('RecallBond:testnet-wallet:v1'));
  decipher.setAuthTag(Buffer.from(tag,'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8');
}
export const normalizeEmail=email=>{
  const clean=typeof email==='string'?email.trim().toLowerCase():'';
  if(clean.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))throw Error('Enter a valid email address');
  return clean;
};
export function validatePassword(password){
  if(typeof password!=='string'||password.length<12||password.length>128)throw Error('Use a password between 12 and 128 characters');
  return password;
}
export async function hashPassword(password){
  validatePassword(password);
  const salt=randomBytes(16),cost=16384,blockSize=8,parallel=1;
  const key=await scryptAsync(password,salt,64,{N:cost,r:blockSize,p:parallel,maxmem:64*1024*1024});
  return ['scrypt',cost,blockSize,parallel,salt.toString('base64url'),key.toString('base64url')].join('$');
}
export async function verifyPassword(password,stored){
  if(typeof password!=='string'||password.length>128||typeof stored!=='string')return false;
  const [type,N,r,p,salt,digest]=stored.split('$');
  if(type!=='scrypt'||N!=='16384'||r!=='8'||p!=='1'||!salt||!digest)return false;
  const prev=Buffer.from(digest,'base64url');
  if(prev.length!==64)return false;
  const next=await scryptAsync(password,Buffer.from(salt,'base64url'),64,{N:16384,r:8,p:1,maxmem:64*1024*1024});
  return timingSafeEqual(prev,next);
}
export const newSessionToken=()=>randomBytes(32).toString('base64url');
export const sessionDigest=token=>createHash('sha256').update(token).digest('hex');
export function safeCompanyName(name){
  const v=typeof name==='string'?name.trim():'';
  if(v.length<2||v.length>120)throw Error('Company name must be between 2 and 120 characters');
  return v;
}
