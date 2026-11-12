// Read-only NEAR testnet JSON-RPC adapter. NEVER signs transactions or accesses private keys.
export const TESTNET_RPC = 'https://rpc.testnet.near.org';
export function validateAccountId(accountId) {
  return typeof accountId === 'string' && accountId.length >= 2 && accountId.length <= 64 &&
    /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(accountId);
}
export function validateTokenId(tokenId) {
  return typeof tokenId === 'string' && tokenId.length > 0 && tokenId.length <= 128 &&
    !/[\u0000-\u001f]/.test(tokenId);
}
function encodeBase64(value) {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
export async function viewCall({ contractId, method, args = {}, fetchImpl = fetch, rpcUrl = TESTNET_RPC }) {
  if (!validateAccountId(contractId)) throw new Error('Enter a valid NEAR testnet contract account.');
  if (!['get_product', 'nft_token', 'get_campaign', 'get_claimant', 'get_credit'].includes(method))
    throw new Error('Method not permitted for read-only verification.');
  const payload = { jsonrpc:'2.0', id:'recallbond-verify',
    method:'query', params:{request_type:'call_function',finality:'final',
      account_id:contractId,method_name:method,args_base64:encodeBase64(args)} };
  let response;
  try {
    response = await fetchImpl(rpcUrl, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload),
    });
  } catch { throw new Error('NEAR testnet RPC unavailable. Retry later.'); }
  if (!response.ok) throw new Error('NEAR testnet request failed (HTTP ' + response.status + ').');
  const data = await response.json();
  if (data.error) throw new Error('NEAR testnet RPC rejected the request. Check the contract account.');
  if (!Array.isArray(data.result?.result)) throw new Error('Unexpected response from NEAR testnet.');
  let value;
  try { value = JSON.parse(new TextDecoder().decode(Uint8Array.from(data.result.result))); }
  catch { throw new Error('Unable to decode onchain contract response.'); }
  return { value, blockHeight:data.result.block_height, blockHash:data.result.block_hash };
}
export async function verifyPassportOnTestnet({ contractId, tokenId, fetchImpl, rpcUrl }) {
  if (!validateTokenId(tokenId)) throw new Error('Enter a valid passport token ID.');
  const response = await viewCall({ contractId, method:'get_product',
    args:{token_id:tokenId}, fetchImpl, rpcUrl });
  const p = response.value;
  if (p === null) return { found:false, tokenId, contractId, blockHeight:response.blockHeight };
  if (!p || p.token_id !== tokenId || typeof p.manufacturer !== 'string' || typeof p.batch_id !== 'string')
    throw new Error('The account returned an incompatible product record.');
  // Do not expose owner_id or serial_commitment in the public UI.
  return { found:true, tokenId:p.token_id, manufacturer:p.manufacturer, batch:p.batch_id,
    contractId, blockHeight:response.blockHeight };
}
