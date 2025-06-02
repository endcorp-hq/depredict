use anchor_lang::prelude::*;

use crate::{
    events::MarketEvent,
};

#[account]
#[derive(InitSpace)]
pub struct MarketState {
    pub bump: u8,
    pub market_id: u64,
    pub authority: Pubkey,
    pub oracle_pubkey: Option<Pubkey>,
    pub collection_mint: Option<Pubkey>,
    pub collection_metadata: Option<Pubkey>,
    pub collection_master_edition: Option<Pubkey>,
    pub market_vault: Option<Pubkey>,
    pub yes_liquidity: u64,
    pub no_liquidity: u64,
    pub volume: u64,
    pub update_ts: i64, // TODO: Rename this
    pub padding_1: [u8; 8],
    pub next_position_id: u64,
    pub market_state: MarketStates,
    pub market_start: i64,
    pub market_end: i64,
    pub question: [u8; 80],
    pub winning_direction: WinningDirection,
    pub version: u64,
    // pub pool_id: u64,
    pub padding: [u8; 72],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
#[derive(InitSpace)]
pub enum WinningDirection {
    None,
    Yes,
    No,
    Draw,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateMarketArgs {
    pub market_id: u64,
    pub question: [u8; 80],
    pub market_start: i64,
    pub market_end: i64,
    pub metadata_uri: String,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateMarketArgs {
    pub market_id: u64,
    pub market_end: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CloseMarketArgs {
    pub market_id: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace, PartialEq, Eq, Debug)]
pub enum MarketStates {
    //market is active and can be voted on by users
    Active,
    //market is ended and no more votes can be made (this state is for daily markets that resolve the next day)
    Ended,
    //market is resolving and the winning direction is being determined
    Resolving,
    //market is resolved and the winning direction is determined
    Resolved,
}


impl Default for MarketState {
    fn default() -> Self {
        Self {
            bump: 0,
            authority: Pubkey::default(),
            oracle_pubkey: None,
            collection_mint: None,
            collection_metadata: None,
            collection_master_edition: None,
            market_vault: None,
            market_id: 0,
            yes_liquidity: 0,
            no_liquidity: 0,
            update_ts: 0,
            next_position_id: 1,
            market_state: MarketStates::Active,
            market_start: 0,
            market_end: 0,
            volume: 0,
            padding_1: [0; 8],
            winning_direction: WinningDirection::None,
            question: [0; 80],
            version: 0,
            padding: [0; 72],
        }
    }
}


impl MarketState {
    pub fn next_position_id(&mut self) -> u64 {
        let id: u64 = self.next_position_id;
        self.next_position_id = self.next_position_id.checked_add(1).unwrap();
        id
    }

    pub fn next_version(&mut self) {
        self.version = self.version.checked_add(1).unwrap();
    }

    // pub fn get_current_price(&self, direction: OrderDirection) -> u64 {
    //     match direction {
    //         OrderDirection::Yes => self.yes_price,
    //         OrderDirection::No => self.no_price,
    //     }
    // }

    // pub fn is_valid_order_price(
    //     &self,
    //     price: u64,
    // ) -> bool {
    //     if price > 1_000_000 {
    //         return false;
    //     }
    //     true
    // }

    // pub fn update_market_prices(&mut self) -> Result<()> {
    //     let yes_shares = if self.yes_shares == 0 {
    //         2
    //     } else {
    //         self.yes_shares
    //     };
    //     let no_shares = if self.no_shares == 0 {
    //         2
    //     } else {
    //         self.no_shares
    //     };

    //     self.yes_price = self
    //         .yes_liquidity
    //         .checked_mul(1_000_000)
    //         .unwrap()
    //         .checked_div(yes_shares)
    //         .unwrap()
    //         .clamp(1, 999_999);

    //     self.no_price = self
    //         .no_liquidity
    //         .checked_mul(1_000_000)
    //         .unwrap()
    //         .checked_div(no_shares)
    //         .unwrap()
    //         .clamp(1, 999_999);

    //     require!(
    //         self.yes_price <= 1_000_000 && self.no_price <= 1_000_000,
    //         ShortxError::InvalidPrice
    //     );

    //     emit!(PriceEvent {
    //         market_id: self.market_id,
    //         yes_price: self.yes_price,
    //         no_price: self.no_price,
    //         timestamp: Clock::get()?.unix_timestamp,
    //     });

    //     Ok(())
    // }

    // pub fn update_price(
    //     &mut self,
    //     amount: u64,
    //     future_price: u64,
    //     direction: OrderDirection,
    //     is_open: bool,
    // ) -> Result<()> {
    //     match direction {
    //         OrderDirection::Yes => {
    //             self.yes_price = future_price.clamp(1, 999_999);

    //             if is_open {
    //                 self.yes_liquidity = self.yes_liquidity.checked_add(amount).unwrap();
    //             } else {
    //                 self.yes_liquidity = self.yes_liquidity.checked_sub(amount).unwrap();
    //             }

    //             self.no_price = (1_000_000_u64)
    //                 .checked_sub(self.yes_price)
    //                 .unwrap()
    //                 .clamp(1, 999_999);
    //         }
    //         OrderDirection::No => {
    //             self.no_price = future_price.clamp(1, 999_999);

    //             if is_open {
    //                 self.no_liquidity = self.no_liquidity.checked_add(amount).unwrap();
    //             } else {
    //                 self.no_liquidity = self.no_liquidity.checked_sub(amount).unwrap();
    //             }

    //             self.yes_price = (1_000_000_u64)
    //                 .checked_sub(self.no_price)
    //                 .unwrap()
    //                 .clamp(1, 999_999);
    //         }
    //     }

    //     emit!(PriceEvent {
    //         market_id: self.market_id,
    //         yes_price: self.yes_price,
    //         no_price: self.no_price,
    //         timestamp: Clock::get()?.unix_timestamp,
    //     });

    //     Ok(())
    // }

    pub fn emit_market_event(&self) -> Result<()> {
        emit!(MarketEvent {
            authority: self.authority,
            market_id: self.market_id,
            yes_liquidity: self.yes_liquidity,
            no_liquidity: self.no_liquidity,
            volume: self.volume,
            update_ts: self.update_ts,
            next_position_id: self.next_position_id,
            winning_direction: self.winning_direction,
            market_start: self.market_start,
            market_end: self.market_end,
            market_state: self.market_state,
            question: self.question,
        });

        Ok(())
    }
}
