use crate::{
    constants::POSITION,
    errors::ShortxError,
    state::{ MarketState, Position, PositionAccount},
};
use anchor_lang::prelude::*;




#[derive(Accounts)]
#[instruction(sub_position_key: Pubkey)]
pub struct SubPositionContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        constraint = market.market_id == market_positions_account.market_id @ ShortxError::InvalidMarketId
    )] // Market
    pub market: Box<Account<'info, MarketState>>,

    #[account(
        mut,
        seeds = [POSITION.as_bytes(), market.market_id.to_le_bytes().as_ref()],
        bump,
        constraint = market_positions_account.is_sub_position == false @ ShortxError::UserTradeIsSubUser,
        constraint = market_positions_account.market_id == market.market_id @ ShortxError::InvalidMarketId
    )]
    pub market_positions_account: Box<Account<'info, PositionAccount>>,

    #[account(
        init,
        payer = signer,
        space = 8 + PositionAccount::INIT_SPACE,
        seeds = [POSITION.as_bytes(), market_positions_account.market_id.to_le_bytes().as_ref(), sub_position_key.key().as_ref()],
        bump
    )]
    pub sub_market_positions: Box<Account<'info, PositionAccount>>,

    pub system_program: Program<'info, System>,
}

impl<'info> SubPositionContext<'info> {
    pub fn create_sub_position_account(
        &mut self,
        _sub_position_key: Pubkey,
        bumps: &SubPositionContextBumps,
    ) -> Result<()> {
        let market_positions = &mut self.market_positions_account;
        let sub_market_positions = &mut self.sub_market_positions;

        let nonce = market_positions.nonce.checked_add(1).unwrap();

        market_positions.nonce = nonce;

        sub_market_positions.set_inner(PositionAccount {
            bump: bumps.sub_market_positions,
            authority: self.signer.key(),
            version: 0,
            positions: [Position::default(); 10],
            nonce,
            market_id: market_positions.market_id,
            is_sub_position: true,
            padding: [0; 25],
        });

        Ok(())
    }
}