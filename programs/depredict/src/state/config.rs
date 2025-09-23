use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub bump: u8,
    pub authority: Pubkey,
    pub fee_vault: Pubkey,
    pub fee_amount: u16, 
    pub version: u16,
    pub next_market_id: u64,
    pub global_markets: u64,
    pub base_uri: [u8; 200],
}

impl Config {
    pub fn next_market_id(&mut self) -> u64 {
        let id = self.next_market_id;
        msg!("this is the next market id: {}", id);
        msg!("this is the next market id before increment: {}", self.next_market_id);
        self.next_market_id = self.next_market_id.checked_add(1).unwrap();
        msg!("this is the next market id after increment: {}", self.next_market_id);
        id
    }
}

