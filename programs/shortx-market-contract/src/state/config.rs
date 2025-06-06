use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub bump: u8,
    pub authority: Pubkey,
    pub fee_vault: Pubkey,
    pub fee_amount: u64,
    pub version: u64,
    pub num_markets: u64,
}

impl Config {
    pub fn next_market_id(&mut self) -> u64 {
        // calculates the next market id but does not update the num_markets
        let id: u64 = self.num_markets.checked_add(1).unwrap();
        id
    }
}

