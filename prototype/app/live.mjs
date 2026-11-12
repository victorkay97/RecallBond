// Read-only sample actor proof: does NOT log in as Tomi, create keys, or make payments.
import { viewCall } from '../verify/testnet-rpc.mjs';
const contractId='rb-vk97-261112.testnet';
const tomi='tomi-vk97-261112.testnet';
const token='RB-NV-002891';
const $=id=>document.getElementById(id);
const text=(id,value)=>{const el=$(id);if(el){el.textContent=String(value);el.classList.remove('rb-skeleton')}};
const nearAmount=value=>{
  const amount=BigInt(value),unit=10n**24n;
  const whole=amount/unit,frac=((amount%unit)*1000n/unit).toString().padStart(3,'0').replace(/0+$/,'');
  return whole.toString()+(frac?'.'+frac:'')+' NEAR';
};
try {
 const [p,c,claim,credit,owned]=await Promise.all([
   viewCall({contractId,method:'get_product',args:{token_id:token}}),
   viewCall({contractId,method:'get_campaign',args:{id:0}}),
   viewCall({contractId,method:'get_claimant',args:{campaign_id:0,token_id:token}}),
   viewCall({contractId,method:'get_credit',args:{account_id:tomi}}),
   viewCall({contractId,method:'nft_tokens_for_owner',args:{account_id:tomi,from_index:'0',limit:100}})
 ]);
 if(p.value?.owner_id!==tomi || p.value.token_id!==token || c.value?.batch_id!=='BATTERY-X21' ||
   c.value?.manufacturer!=='novatech-vk97-261112.testnet' || !Array.isArray(owned.value)) throw new Error('Unexpected chain record');
 const count=owned.value.filter(t=>t.token_id===token).length;
 if(count!==1)throw new Error('Passport ownership discrepancy');
 text('consumer-live-count',count);
 text('cs-mobile-live-count',count);
 text('consumer-live-status','Verified · Onchain');
 text('consumer-live-owner','Registered to demo actor '+tomi);
 text('consumer-live-claims',String(c.value.claimed_count));
 text('consumer-live-batch',claim.value===tomi?'Claimed by Tomi · Campaign #0':'Campaign #0 · Not claimed by Tomi');
 text('consumer-live-credit',nearAmount(credit.value));
 text('consumer-live-block','Finalized at block '+String(c.blockHeight));
}catch(error){
 console.warn('RecallBond demo actor view unavailable:',error instanceof Error?error.message:'Unknown error');
 text('consumer-live-status','Temporarily unavailable');
 text('consumer-live-count','—');
 text('cs-mobile-live-count','—');
 text('consumer-live-claims','—');
 text('consumer-live-credit','—');
 text('consumer-live-owner','Live owner unavailable · see explorer receipts');
 text('consumer-live-block','Read-only testnet RPC unavailable. No data has been fabricated.');
}
