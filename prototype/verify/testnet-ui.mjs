import { verifyPassportOnTestnet } from './testnet-rpc.mjs';
// Read-only, opt-in public RPC lookup; fictional sample UI remains independently labeled.
const form=document.getElementById('testnet-form');
const contract=document.getElementById('testnet-contract');
const token=document.getElementById('testnet-token');
const output=document.getElementById('testnet-result');
const submit=document.getElementById('testnet-submit');
const make=(tag,label,value)=>{
 const element=document.createElement(tag);if(label)element.className=label;
 if(value!==undefined)element.textContent=String(value);return element;
};
const params=new URLSearchParams(location.search);
if(params.get('id')) token.value=params.get('id').slice(0,128);
function detail(name,value){
 const row=make('div','item-row');
 const label=make('div');label.append(make('b','',name));
 const text=make('span','value',value);text.style.overflowWrap='anywhere';
 row.append(label,text);return row;
}
form.addEventListener('submit',async event=>{
 event.preventDefault();
 output.replaceChildren(make('p','small muted','Querying public NEAR testnet RPC…'));
 submit.disabled=true;
 try {
  const record=await verifyPassportOnTestnet({contractId:contract.value.trim(),tokenId:token.value.trim()});
  output.replaceChildren();
  const heading=make('h3','',record.found?'Public onchain record found':'No product record at this token ID');
  heading.style.marginBottom='12px';output.append(heading);
  output.append(detail('Contract account (user supplied)',record.contractId));
  output.append(detail('Token ID',record.tokenId));
  if(record.found){
   output.append(detail('Issuer account (contract-reported)',record.manufacturer));
   output.append(detail('Public batch',record.batch));
  }
  if(record.blockHeight!==undefined)output.append(detail('NEAR testnet block',record.blockHeight));
  const link=make('a','btn soft','View contract on testnet explorer');
  link.href='https://testnet.nearblocks.io/address/'+encodeURIComponent(record.contractId);
  link.target='_blank';link.rel='noopener noreferrer';link.style.marginTop='15px';
  output.append(link);
  output.append(make('p','small muted',record.found?'Owner account and serial commitments are intentionally hidden in this UI. An onchain product record does not verify real-world authenticity.':'This result only means this queried contract has no get_product record at the token ID.'));
 } catch(error) {
  output.replaceChildren(make('p','notice warn',error instanceof Error?error.message:'Network lookup failed.'));
 } finally {submit.disabled=false;}
});
