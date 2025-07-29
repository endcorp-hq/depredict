use crate::errors::DepredictError;

use anchor_lang::prelude::*;
use switchboard_on_demand::{
    prelude::rust_decimal::Decimal,
    PullFeedAccountData,
};


pub fn get_oracle_value(oracle_account: &AccountInfo) -> anchor_lang::Result<Decimal> {
    let feed_account = oracle_account.try_borrow_data()
        .map_err(|_| DepredictError::InvalidOracle)?;

    let feed = PullFeedAccountData::parse(feed_account).map_err(|e| {
        msg!("Error parsing oracle data: {:?}", e);
        DepredictError::InvalidOracle
    })?;

    let value = feed.value(&Clock::get().map_err(|_| DepredictError::InvalidOracle)?).map_err(|e| {
        msg!("Error getting value: {:?}", e);
        DepredictError::InvalidOracle
    })?;

    msg!("Oracle value: {:?}", value);
    Ok(value)
}

// Check if the oracle is valid during market creation
pub fn is_valid_oracle(feed_account: &AccountInfo) -> anchor_lang::Result<bool> {
    let data = match feed_account.try_borrow_data() {
        Ok(data) => data,
        Err(e) => {
            msg!("Failed to borrow oracle account data: {:?}", e);
            return Ok(false);
        }
    };

    match PullFeedAccountData::parse(data) {
        Ok(_) => Ok(true),
        Err(e) => {
            msg!("Failed to parse oracle account as Switchboard feed: {:?}", e);
            Ok(false)
        }
    }
}
