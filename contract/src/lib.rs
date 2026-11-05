//! RecallBond: NEP-171 passports with funded, transferable recall rights.
//! Hackathon prototype. Uncompiled, not audited; never use with real funds.
use near_contract_standards::non_fungible_token::approval::NonFungibleTokenApproval;
use near_contract_standards::non_fungible_token::core::{NonFungibleTokenCore,NonFungibleTokenResolver};
use near_contract_standards::non_fungible_token::enumeration::NonFungibleTokenEnumeration;
use near_contract_standards::non_fungible_token::metadata::{NFTContractMetadata,NonFungibleTokenMetadataProvider,TokenMetadata};
use near_contract_standards::non_fungible_token::{NonFungibleToken,Token,TokenId};
use near_sdk::borsh::{BorshDeserialize,BorshSerialize};
use near_sdk::collections::{LazyOption,LookupMap,UnorderedSet};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize,Serialize};
use near_sdk::{env,ext_contract,near,require,AccountId,BorshStorageKey,Gas,NearToken,PanicOnDefault,Promise,PromiseOrValue,PromiseResult};
use std::collections::HashMap;

const CALLBACK_GAS:Gas=Gas::from_tgas(15);

#[derive(BorshStorageKey)]
#[near]
enum StorageKey {
 Token,TokenMetadata,Enumeration,Approval,Metadata,
 Manufacturers,Products,SerialCommitments,Batches,BatchIssuers,FrozenBatches,
 Campaigns,Claims,Credits,PendingTransfers,
}
#[derive(BorshDeserialize,BorshSerialize,Clone)]
pub struct Product {
 pub batch_id:String,
 pub manufacturer:AccountId,
 /// SHA-256 commitment; never store raw serials or personal information.
 pub serial_commitment:String,
}
#[derive(Serialize,Deserialize)]
#[serde(crate="near_sdk::serde")]
pub struct ProductView {
 pub token_id:TokenId,pub owner_id:AccountId,pub batch_id:String,
 pub manufacturer:AccountId,pub serial_commitment:String,
}
#[derive(BorshDeserialize,BorshSerialize,Clone)]
pub struct Campaign {
 pub id:u64,pub manufacturer:AccountId,pub batch_id:String,
 pub eligible_count:u64,pub payout_yocto:u128,pub max_liability_yocto:u128,
 pub funded_yocto:u128,pub expiry_ns:u64,pub activated:bool,pub closed:bool,pub claimed_count:u64,
}
#[derive(Serialize,Deserialize)]
#[serde(crate="near_sdk::serde")]
pub struct CampaignView {
 pub id:u64,pub manufacturer:AccountId,pub batch_id:String,
 pub eligible_count:u64,pub payout_yocto:U128,pub max_liability_yocto:U128,
 pub funded_yocto:U128,pub expiry_ns:u64,pub activated:bool,pub closed:bool,pub claimed_count:u64,
}
impl From<Campaign> for CampaignView {
 fn from(c:Campaign)->Self {
  Self{id:c.id,manufacturer:c.manufacturer,batch_id:c.batch_id,eligible_count:c.eligible_count,
   payout_yocto:U128(c.payout_yocto),max_liability_yocto:U128(c.max_liability_yocto),
   funded_yocto:U128(c.funded_yocto),expiry_ns:c.expiry_ns,activated:c.activated,
   closed:c.closed,claimed_count:c.claimed_count}
 }
}
#[ext_contract(ext_self)]
trait SelfCallbacks {
 fn on_withdraw_complete(&mut self,recipient:AccountId,amount:U128)->bool;
}
#[derive(PanicOnDefault)]
#[near(contract_state)]
pub struct RecallBond {
 admin:AccountId,
 tokens:NonFungibleToken,
 metadata:LazyOption<NFTContractMetadata>,
 manufacturers:UnorderedSet<AccountId>,
 products:LookupMap<TokenId,Product>,
 serial_commitments:UnorderedSet<String>,
 batch_counts:LookupMap<String,u64>,
 batch_issuers:LookupMap<String,AccountId>,
 frozen_batches:UnorderedSet<String>,
 campaigns:LookupMap<u64,Campaign>,
 next_campaign_id:u64,
 /// Key: campaign-id|token-id. An approved claim cannot be replayed.
 claims:LookupMap<String,AccountId>,
 /// Claim credit is attached to the claimant, not future owners.
 credits:LookupMap<AccountId,u128>,
 /// Protect against reversible NFT transfer_call during claim.
 pending_transfers:UnorderedSet<TokenId>,
}
#[near]
impl RecallBond {
 #[init]
 pub fn new(admin:AccountId)->Self {
  require!(!env::state_exists(),"Already initialized");
  let metadata=NFTContractMetadata{
   spec:"nft-1.0.0".into(),name:"RecallBond Product Passports".into(),
   symbol:"RBOND".into(),icon:None,base_uri:None,reference:None,reference_hash:None,
  };
  Self{
   tokens:NonFungibleToken::new(StorageKey::Token,admin.clone(),Some(StorageKey::TokenMetadata),
     Some(StorageKey::Enumeration),Some(StorageKey::Approval)),
   metadata:LazyOption::new(StorageKey::Metadata,Some(&metadata)),
   admin,manufacturers:UnorderedSet::new(StorageKey::Manufacturers),
   products:LookupMap::new(StorageKey::Products),
   serial_commitments:UnorderedSet::new(StorageKey::SerialCommitments),
   batch_counts:LookupMap::new(StorageKey::Batches),
   batch_issuers:LookupMap::new(StorageKey::BatchIssuers),
   frozen_batches:UnorderedSet::new(StorageKey::FrozenBatches),
   campaigns:LookupMap::new(StorageKey::Campaigns),next_campaign_id:0,
   claims:LookupMap::new(StorageKey::Claims),
   credits:LookupMap::new(StorageKey::Credits),
   pending_transfers:UnorderedSet::new(StorageKey::PendingTransfers),
  }
 }
 #[payable]
 pub fn register_manufacturer(&mut self,manufacturer:AccountId) {
  require!(env::predecessor_account_id()==self.admin,"Admin only");
  let before=env::storage_usage();
  require!(self.manufacturers.insert(&manufacturer),"Already registered");
  self.refund_excess_storage(before);
 }
 #[payable]
 pub fn mint_product(&mut self,token_id:TokenId,owner_id:AccountId,batch_id:String,
    serial_commitment:String,token_metadata:TokenMetadata)->Token {
  let issuer=env::predecessor_account_id();
  require!(self.manufacturers.contains(&issuer),"Unregistered manufacturer");
  require!(!batch_id.is_empty() && batch_id.len()<=100,"Invalid batch");
  require!(serial_commitment.len()==64 && serial_commitment.bytes().all(|b|b.is_ascii_hexdigit()),"Expected SHA-256 commitment");
  require!(!self.frozen_batches.contains(&batch_id),"Batch frozen for recall");
  require!(self.products.get(&token_id).is_none(),"Token already registered");
  let serial_key=format!("{}|{}",issuer,serial_commitment.to_lowercase());
  require!(!self.serial_commitments.contains(&serial_key),"Serial already registered");
  if let Some(existing)=self.batch_issuers.get(&batch_id) {
   require!(existing==issuer,"Batch owned by another manufacturer");
  }
  let before=env::storage_usage();
  self.batch_issuers.insert(&batch_id,&issuer);
  let next=self.batch_counts.get(&batch_id).unwrap_or(0).checked_add(1).expect("count overflow");
  self.batch_counts.insert(&batch_id,&next);
  self.serial_commitments.insert(&serial_key);
  self.products.insert(&token_id,&Product{batch_id,manufacturer:issuer,serial_commitment});
  let token=self.tokens.internal_mint(token_id,owner_id,Some(token_metadata));
  self.refund_excess_storage(before);
  token
 }
 #[payable]
 pub fn create_campaign(&mut self,batch_id:String,payout_yocto:U128,expiry_ns:u64)->u64 {
  let issuer=env::predecessor_account_id();
  require!(self.manufacturers.contains(&issuer),"Unregistered manufacturer");
  require!(self.batch_issuers.get(&batch_id)==Some(issuer.clone()),"Not your batch");
  require!(expiry_ns>env::block_timestamp(),"Expiry must be in future");
  require!(payout_yocto.0>0,"Zero payout");
  let count=self.batch_counts.get(&batch_id).unwrap_or(0);
  require!(count>0,"Batch is empty");
  let max_liability=(count as u128).checked_mul(payout_yocto.0).expect("liability overflow");
  let before=env::storage_usage();
  self.frozen_batches.insert(&batch_id);
  let id=self.next_campaign_id;
  self.next_campaign_id=id.checked_add(1).expect("campaign counter overflow");
  self.campaigns.insert(&id,&Campaign{id,manufacturer:issuer,batch_id,eligible_count:count,
   payout_yocto:payout_yocto.0,max_liability_yocto:max_liability,funded_yocto:0,
   expiry_ns,activated:false,closed:false,claimed_count:0});
  self.refund_excess_storage(before);
  id
 }
 #[payable]
 pub fn fund_campaign(&mut self,campaign_id:u64) {
  let deposit=env::attached_deposit().as_yoctonear();
  require!(deposit>0,"Attach a deposit");
  let mut c=self.must_campaign(campaign_id);
  require!(env::predecessor_account_id()==c.manufacturer,"Issuer only");
  require!(!c.activated && !c.closed,"Not accepting funds");
  require!(env::block_timestamp()<c.expiry_ns,"Campaign expired");
  c.funded_yocto=c.funded_yocto.checked_add(deposit).expect("fund overflow");
  require!(c.funded_yocto<=c.max_liability_yocto,"Excess funding");
  self.campaigns.insert(&campaign_id,&c);
 }
 pub fn activate_campaign(&mut self,campaign_id:u64) {
  let mut c=self.must_campaign(campaign_id);
  require!(env::predecessor_account_id()==c.manufacturer,"Issuer only");
  require!(!c.activated && !c.closed,"Already activated or closed");
  require!(env::block_timestamp()<c.expiry_ns,"Campaign expired");
  require!(c.funded_yocto==c.max_liability_yocto,"Fund full liability first");
  c.activated=true;
  self.campaigns.insert(&campaign_id,&c);
 }
 #[payable]
 pub fn claim_compensation(&mut self,campaign_id:u64,token_id:TokenId)->U128 {
  let caller=env::predecessor_account_id();
  let mut c=self.must_campaign(campaign_id);
  require!(c.activated && !c.closed,"Campaign inactive");
  require!(env::block_timestamp()<=c.expiry_ns,"Campaign expired");
  require!(!self.pending_transfers.contains(&token_id),"Transfer is not finalized");
  let product=self.products.get(&token_id).expect("Unknown product");
  require!(product.batch_id==c.batch_id && product.manufacturer==c.manufacturer,"Not eligible");
  let owner=self.tokens.nft_token(token_id.clone()).expect("Unknown NFT").owner_id;
  require!(owner==caller,"Only current owner can claim");
  let key=format!("{}|{}",campaign_id,token_id);
  require!(self.claims.get(&key).is_none(),"Already claimed");
  require!(c.funded_yocto>=c.payout_yocto,"Insufficient reserve");
  let before=env::storage_usage();
  self.claims.insert(&key,&caller);
  c.funded_yocto-=c.payout_yocto;
  c.claimed_count=c.claimed_count.checked_add(1).expect("claim counter overflow");
  self.campaigns.insert(&campaign_id,&c);
  let current=self.credits.get(&caller).unwrap_or(0);
  self.credits.insert(&caller,&current.checked_add(c.payout_yocto).expect("credit overflow"));
  self.refund_excess_storage(before);
  U128(c.payout_yocto)
 }
 pub fn withdraw_compensation(&mut self)->Promise {
  let caller=env::predecessor_account_id();
  let amount=self.credits.remove(&caller).unwrap_or(0);
  require!(amount>0,"No compensation available");
  Promise::new(caller.clone()).transfer(NearToken::from_yoctonear(amount)).then(
   ext_self::ext(env::current_account_id()).with_static_gas(CALLBACK_GAS)
    .on_withdraw_complete(caller,U128(amount)))
 }
 #[private]
 pub fn on_withdraw_complete(&mut self,recipient:AccountId,amount:U128)->bool {
  match env::promise_result(0) {
   PromiseResult::Successful(_)=>true,
   _=>{
    let old=self.credits.get(&recipient).unwrap_or(0);
    self.credits.insert(&recipient,&old.checked_add(amount.0).expect("credit overflow"));
    false
   }
  }
 }
 pub fn close_campaign(&mut self,campaign_id:u64) {
  let mut c=self.must_campaign(campaign_id);
  require!(env::predecessor_account_id()==c.manufacturer,"Issuer only");
  require!(!c.closed && env::block_timestamp()>c.expiry_ns,"Not closable");
  let refund=c.funded_yocto;
  c.funded_yocto=0;
  c.closed=true;
  self.campaigns.insert(&campaign_id,&c);
  if refund>0 {
   let old=self.credits.get(&c.manufacturer).unwrap_or(0);
   self.credits.insert(&c.manufacturer,&old.checked_add(refund).expect("credit overflow"));
  }
 }
 pub fn get_campaign(&self,id:u64)->CampaignView {self.must_campaign(id).into()}
 pub fn get_product(&self,token_id:TokenId)->Option<ProductView> {
  let p=self.products.get(&token_id)?;
  let owner_id=self.tokens.nft_token(token_id.clone())?.owner_id;
  Some(ProductView{token_id,owner_id,batch_id:p.batch_id,manufacturer:p.manufacturer,
   serial_commitment:p.serial_commitment})
 }
 pub fn get_claimant(&self,campaign_id:u64,token_id:TokenId)->Option<AccountId> {
  self.claims.get(&format!("{}|{}",campaign_id,token_id))
 }
 pub fn get_credit(&self,account_id:AccountId)->U128 {U128(self.credits.get(&account_id).unwrap_or(0))}
 fn must_campaign(&self,id:u64)->Campaign {self.campaigns.get(&id).expect("Campaign not found")}
 fn refund_excess_storage(&self,before:u64) {
  let used=env::storage_usage().saturating_sub(before) as u128;
  let cost=used.checked_mul(env::storage_byte_cost().as_yoctonear()).expect("storage overflow");
  let attached=env::attached_deposit().as_yoctonear();
  require!(attached>=cost,"Insufficient attached NEAR for storage");
  let refund=attached-cost;
  if refund>1 {Promise::new(env::predecessor_account_id()).transfer(NearToken::from_yoctonear(refund));}
 }
}
#[near]
impl NonFungibleTokenCore for RecallBond {
 #[payable]
 fn nft_transfer(&mut self,receiver_id:AccountId,token_id:TokenId,
  approval_id:Option<u64>,memo:Option<String>) {
  require!(!self.pending_transfers.contains(&token_id),"Token transfer pending");
  self.tokens.nft_transfer(receiver_id,token_id,approval_id,memo);
 }
 #[payable]
 fn nft_transfer_call(&mut self,receiver_id:AccountId,token_id:TokenId,
  approval_id:Option<u64>,memo:Option<String>,msg:String)->PromiseOrValue<bool> {
  require!(!self.pending_transfers.contains(&token_id),"Token transfer pending");
  self.pending_transfers.insert(&token_id);
  self.tokens.nft_transfer_call(receiver_id,token_id,approval_id,memo,msg)
 }
 fn nft_token(&self,token_id:TokenId)->Option<Token> {self.tokens.nft_token(token_id)}
}
#[near]
impl NonFungibleTokenResolver for RecallBond {
 #[private]
 fn nft_resolve_transfer(&mut self,previous_owner_id:AccountId,
  receiver_id:AccountId,token_id:TokenId,
  approved_account_ids:Option<HashMap<AccountId,u64>>)->bool {
  let result=self.tokens.nft_resolve_transfer(previous_owner_id,
   receiver_id,token_id.clone(),approved_account_ids);
  self.pending_transfers.remove(&token_id);
  result
 }
}
#[near]
impl NonFungibleTokenApproval for RecallBond {
 #[payable]
 fn nft_approve(&mut self,token_id:TokenId,account_id:AccountId,msg:Option<String>)->Option<Promise> {
  self.tokens.nft_approve(token_id,account_id,msg)
 }
 #[payable]
 fn nft_revoke(&mut self,token_id:TokenId,account_id:AccountId) {
  self.tokens.nft_revoke(token_id,account_id);
 }
 #[payable]
 fn nft_revoke_all(&mut self,token_id:TokenId) {self.tokens.nft_revoke_all(token_id);}
 fn nft_is_approved(&self,token_id:TokenId,approved_account_id:AccountId,
  approval_id:Option<u64>)->bool {
  self.tokens.nft_is_approved(token_id,approved_account_id,approval_id)
 }
}
#[near]
impl NonFungibleTokenEnumeration for RecallBond {
 fn nft_total_supply(&self)->U128 {self.tokens.nft_total_supply()}
 fn nft_tokens(&self,from_index:Option<U128>,limit:Option<u64>)->Vec<Token> {
  self.tokens.nft_tokens(from_index,limit)
 }
 fn nft_supply_for_owner(&self,account_id:AccountId)->U128 {
  self.tokens.nft_supply_for_owner(account_id)
 }
 fn nft_tokens_for_owner(&self,account_id:AccountId,from_index:Option<U128>,limit:Option<u64>)->Vec<Token> {
  self.tokens.nft_tokens_for_owner(account_id,from_index,limit)
 }
}
#[near]
impl NonFungibleTokenMetadataProvider for RecallBond {
 fn nft_metadata(&self)->NFTContractMetadata {self.metadata.get().unwrap()}
}
#[cfg(all(test,not(target_arch="wasm32")))]
mod test_suite;
