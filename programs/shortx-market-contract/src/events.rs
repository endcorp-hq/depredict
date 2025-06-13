use anchor_lang::prelude::*;

use crate::state::{ MarketStates, PositionDirection, PositionStatus, WinningDirection };

#[event]
pub struct PriceEvent {
    pub market_id: u64,
    pub yes_price: u64,
    pub no_price: u64,
    pub timestamp: i64,
}

#[event]
pub struct PositionEvent {
    pub market_id: u64,
    pub amount: u64,
    pub direction: PositionDirection,
    pub position_status: PositionStatus,
    pub ts: i64,
    pub created_at: i64,
}

#[event]
pub struct MarketEvent {
    pub authority: Pubkey,
    pub market_id: u64,
    pub yes_liquidity: u64,
    pub no_liquidity: u64,
    pub volume: u64,
    pub update_ts: i64,
    pub next_position_id: u64,
    // pub fee_bps: u16,
    // pub payout_fee_available: u64,
    // pub payout_fee_claimed: u64,
    // pub market_fee_available: u64,
    // pub market_fee_claimed: u64,
    pub market_state: MarketStates,
    pub market_start: i64,
    pub market_end: i64,
    pub question: [u8; 80],
    pub winning_direction: WinningDirection,
    // pub payout_fee: u16,
    // pub pool_id: u64,
}

#[event]
pub struct PoolEvent {
    pub pool_id: u64,
    pub question: [u8; 80],
    pub authority: Pubkey,
    pub markets: [u64; 60],
}
