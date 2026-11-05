// Preliminary NEAR SDK unit tests; compilation must be verified in CI.
use super::*;
use near_sdk::test_utils::{accounts,VMContextBuilder};
use near_sdk::{testing_env,NearToken};

const PAYOUT:u128=100_000_000_000_000_000_000_000; // 0.1 NEAR

fn context(caller:AccountId,deposit:NearToken) {
 let mut b=VMContextBuilder::new();
 b.current_account_id(accounts(0))
  .signer_account_id(caller.clone()).predecessor_account_id(caller)
  .attached_deposit(deposit).block_timestamp(1_000);
 testing_env!(b.build());
}
fn metadata()->TokenMetadata {
 TokenMetadata {
  title:Some("NovaBook Air".into()),description:Some("Fictional demo laptop".into()),
  media:None,media_hash:None,copies:Some(1),issued_at:None,
  expires_at:None,starts_at:None,updated_at:None,extra:None,
  reference:None,reference_hash:None,
 }
}
fn prepared()->(RecallBond,u64) {
 context(accounts(0),NearToken::from_near(1));
 let mut c=RecallBond::new(accounts(0));
 c.register_manufacturer(accounts(1));
 context(accounts(1),NearToken::from_near(1));
 c.mint_product("nv-1".into(),accounts(2),"B-X21".into(),"a".repeat(64),metadata());
 context(accounts(1),NearToken::from_near(1));
 let id=c.create_campaign("B-X21".into(),U128(PAYOUT),1_000_000);
 context(accounts(1),NearToken::from_yoctonear(PAYOUT));
 c.fund_campaign(id);
 context(accounts(1),NearToken::from_yoctonear(0));
 c.activate_campaign(id);
 (c,id)
}
#[test]
fn transfer_moves_unclaimed_eligibility() {
 let (mut c,id)=prepared();
 context(accounts(2),NearToken::from_yoctonear(1));
 c.nft_transfer(accounts(3),"nv-1".into(),None,None);
 context(accounts(3),NearToken::from_near(1));
 assert_eq!(c.claim_compensation(id,"nv-1".into()),U128(PAYOUT));
 assert_eq!(c.get_claimant(id,"nv-1".into()),Some(accounts(3)));
 assert_eq!(c.get_credit(accounts(3)),U128(PAYOUT));
}
#[test]
#[should_panic(expected="Only current owner can claim")]
fn former_owner_is_ineligible() {
 let (mut c,id)=prepared();
 context(accounts(2),NearToken::from_yoctonear(1));
 c.nft_transfer(accounts(3),"nv-1".into(),None,None);
 context(accounts(2),NearToken::from_near(1));
 c.claim_compensation(id,"nv-1".into());
}
#[test]
#[should_panic(expected="Already claimed")]
fn duplicate_claim_rejected() {
 let (mut c,id)=prepared();
 context(accounts(2),NearToken::from_near(1));
 c.claim_compensation(id,"nv-1".into());
 context(accounts(2),NearToken::from_near(1));
 c.claim_compensation(id,"nv-1".into());
}
#[test]
#[should_panic(expected="Batch frozen for recall")]
fn cannot_mint_after_campaign_created() {
 let (mut c,_)=prepared();
 context(accounts(1),NearToken::from_near(1));
 c.mint_product("nv-2".into(),accounts(2),"B-X21".into(),"b".repeat(64),metadata());
}
#[test]
#[should_panic(expected="Unregistered manufacturer")]
fn unregistered_issuer_rejected() {
 let (mut c,_)=prepared();
 context(accounts(4),NearToken::from_near(1));
 c.mint_product("fake".into(),accounts(4),"B-Fake".into(),"c".repeat(64),metadata());
}
#[test]
fn approved_credit_stays_with_claimant_after_transfer() {
 let (mut c,id)=prepared();
 context(accounts(2),NearToken::from_near(1));
 c.claim_compensation(id,"nv-1".into());
 context(accounts(2),NearToken::from_yoctonear(1));
 c.nft_transfer(accounts(3),"nv-1".into(),None,None);
 assert_eq!(c.get_campaign(id).funded_yocto,U128(0));
 assert_eq!(c.get_credit(accounts(2)),U128(PAYOUT));
 assert_eq!(c.get_credit(accounts(3)),U128(0));
}
