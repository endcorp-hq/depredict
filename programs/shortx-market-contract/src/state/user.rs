use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct User {
    pub bump: u8,
    pub id: u16,
    pub authority: Pubkey,
    pub padding: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateUserArgs {
    pub authority: Pubkey,
    pub id: u16,
}
