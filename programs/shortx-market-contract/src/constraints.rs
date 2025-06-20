use std::cell::Ref;

use crate::{constants::{MAX_STALE_SLOTS, MIN_SAMPLES}, errors::ShortxError};


use anchor_lang::prelude::*;
use switchboard_on_demand::{prelude::rust_decimal::Decimal, PullFeedAccountData};


pub fn get_oracle_value(oracle_account: &AccountInfo) -> anchor_lang::Result<Decimal> {
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
    let value = oracle_data.get_value(&clock, max_stale_slots, min_samples, true)
        .map_err(|e| {
            msg!("Error getting price: {:?}", e);
            ShortxError::InvalidOracle
        })?;

    msg!("Oracle value: {:?}", value);
    Ok(value)
}

// Refactor this to check if the oracle is valid
pub fn is_valid_oracle(feed_account: Ref<'_, &mut [u8]>) -> anchor_lang::Result<bool> {
    let clock = Clock::get().unwrap();
    let feed = PullFeedAccountData::parse(feed_account).unwrap();
    msg!("valid price: {:?}", feed.value(&clock));
    Ok(true)
}
