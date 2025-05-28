// use std::str::FromStr;

use crate::UserTrade;

use anchor_lang::prelude::*;

// pub fn is_admin(signer: &Signer) -> anchor_lang::Result<bool> {
//     Ok(Pubkey::from_str(ADMIN).unwrap().eq(signer.key))
// }

pub fn is_authority_for_user_trade(
    user_trade: &Account<UserTrade>,
    signer: &Signer
) -> anchor_lang::Result<bool> {
    Ok(user_trade.authority.eq(signer.key))
}

// pub fn is_mint_for_market(market: &Account<MarketState>, mint: &Pubkey) -> anchor_lang::Result<bool> {
//     Ok(market.mint.eq(mint))
// }
