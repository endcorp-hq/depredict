use crate::errors::ShortxError;

use anchor_lang::prelude::*;
use switchboard_on_demand::{
    prelude::rust_decimal::Decimal,
    PullFeedAccountData,
};


pub fn get_oracle_value(oracle_account: &AccountInfo) -> anchor_lang::Result<Decimal> {
    let feed_account = oracle_account.try_borrow_data()
        .map_err(|_| ShortxError::InvalidOracle)?;

    let feed = PullFeedAccountData::parse(feed_account).map_err(|e| {
        msg!("Error parsing oracle data: {:?}", e);
        ShortxError::InvalidOracle
    })?;

    let value = feed.value(&Clock::get().map_err(|_| ShortxError::InvalidOracle)?).map_err(|e| {
        msg!("Error getting value: {:?}", e);
        ShortxError::InvalidOracle
    })?;

    msg!("Oracle value: {:?}", value);
    Ok(value)
}

// Check if the oracle is valid during market creation
 pub fn is_valid_oracle(feed_account: &AccountInfo) -> anchor_lang::Result<bool> {
     let clock = Clock::get().unwrap();
     let feed = PullFeedAccountData::parse(feed_account.try_borrow_data().unwrap()).unwrap();
     msg!("valid price: {:?}", feed.value(&clock));
     Ok(true)
}
