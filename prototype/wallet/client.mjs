// NEAR testnet wallet client. Never handles seed phrases/private keys.
// Wallet picker and execution come from the pinned NEAR Connect SDK, loaded on demand.
export const CONTRACT = 'rb-vk97-261112.testnet';
export const NOVATECH = 'novatech-vk97-261112.testnet';
export const SDK_URL = 'https://esm.sh/@hot-labs/near-connect@0.12.0?bundle';
let connectorPromise;
export function isNearAccountId(id) {
 return typeof id==='string' && id.length>=2 && id.length<=64 &&
   /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(id);
}
export function toYoctoNear(decimal) {
 if(typeof decimal!=='string' || !/^(0|[1-9]\d{0,9})(\.\d{1,24})?$/.test(decimal))throw Error('Enter a valid NEAR amount with up to 24 decimal places.');
 const [whole,part='']=decimal.split('.');
 return (BigInt(whole)*10n**24n+BigInt(part.padEnd(24,'0'))).toString();
}
export function fromYoctoNear(value) {
 const n=BigInt(value);
 const whole=n/(10n**24n),fraction=(n%(10n**24n)).toString().padStart(24,'0').replace(/0+$/,'');
 return whole.toString()+(fraction?'.'+fraction:'');
}
export async function getConnector() {
 if(!connectorPromise)connectorPromise=import(SDK_URL).then(({NearConnector})=>
   new NearConnector({network:'testnet',excludedWallets:['ethereum-wallets']})
 ).catch(error=>{connectorPromise=undefined;throw error});
 return connectorPromise;
}
export async function currentWallet() {
 const connector=await getConnector();
 try {
   const {wallet,accounts}=await connector.getConnectedWallet();
   return {wallet,accountId:accounts?.[0]?.accountId??null};
 } catch { return {wallet:null,accountId:null}; }
}
export async function connectWallet() {
 const connector=await getConnector();
 await connector.connect();
 return currentWallet();
}
export async function disconnectWallet(wallet) {
 const connector=await getConnector();
 if(wallet)await connector.disconnect(wallet);
}
export async function sendContractCall(wallet,{method,args,gas='100000000000000',deposit='0'}) {
 if(!wallet)throw Error('Connect your NEAR testnet wallet first.');
 if(!['mint_product','create_campaign','fund_campaign','activate_campaign',
      'nft_transfer','claim_compensation','withdraw_compensation'].includes(method)) throw Error('Unsupported contract method.');
 if(!/^\d+$/.test(gas)||!/^\d+$/.test(deposit))throw Error('Invalid gas/deposit.');
 return wallet.signAndSendTransaction({
   receiverId:CONTRACT,
   actions:[{type:'FunctionCall',params:{methodName:method,args,gas,deposit}}],
 });
}
