
use crate::{constants::{MAX_STALE_SLOTS, MIN_SAMPLES}, errors::ShortxError};


use anchor_lang::prelude::*;
use switchboard_on_demand::{prelude::rust_decimal::Decimal, PullFeedAccountData};


// pub fn is_authority_for_user_trade(
//     user_trade: &Account<UserTrade>,
//     signer: &Signer
// ) -> anchor_lang::Result<bool> {
//     Ok(user_trade.authority.eq(signer.key))
// }

pub fn get_oracle_price(oracle_account: &AccountInfo) -> anchor_lang::Result<Decimal> {
    let account_data = oracle_account.try_borrow_data()
        .map_err(|_| ShortxError::InvalidOracle)?;

    // Parse the oracle account
    let oracle_data = PullFeedAccountData::parse(account_data)
        .map_err(|e| {
            msg!("Error parsing oracle data: {:?}", e);
            ShortxError::InvalidOracle
        })?;

    let clock = Clock::get().map_err(|_| ShortxError::InvalidOracle)?;
    let max_stale_slots = MAX_STALE_SLOTS;
    let min_samples = MIN_SAMPLES;

    // Get the value
    let price = oracle_data.get_value(&clock, max_stale_slots, min_samples, true)
        .map_err(|e| {
            msg!("Error getting price: {:?}", e);
            ShortxError::InvalidOracle
        })?;

    msg!("Oracle price: {:?}", price);
    Ok(price)
}


pub fn is_valid_oracle(oracle_account: &AccountInfo) -> anchor_lang::Result<bool> {
    let price = get_oracle_price(oracle_account)?;
    // initial price should be 2 as 0 is regarded as no and 1 is regarded as yes. 2 is considered a null value
    Ok(price == Decimal::from(2))

}
