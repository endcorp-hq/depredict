use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub bump: u8,
    pub authority: Pubkey,
    pub fee_vault: Pubkey,
    pub fee_amount: u64, // refactor amount, can be smaller, or potentially a percentage
    pub version: u64,
    pub next_market_id: u64,
    pub num_markets: u64,
    pub global_tree: Pubkey,
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

