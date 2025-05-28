use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub bump: u8,
    pub authority: Pubkey,
    pub fee_vault: Pubkey,
    pub fee_amount: u64,
    pub version: u64,
}

