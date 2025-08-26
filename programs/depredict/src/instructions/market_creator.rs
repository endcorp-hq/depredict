use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::{
    constants::MARKET_CREATOR,
    errors::DepredictError,
    state::{Config, MarketCreator, CreateMarketCreatorArgs, UpdateMarketCreatorArgs},
};

#[derive(Accounts)]
#[instruction(args: CreateMarketCreatorArgs)]
pub struct CreateMarketCreatorContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: fee vault account
    #[account(
        mut, 
        constraint = fee_vault.key() == config.fee_vault @ DepredictError::InvalidFeeVault
    )]
    pub fee_vault: AccountInfo<'info>,

    #[account(mut)]
    pub config: Box<Account<'info, Config>>,

    /// CHECK: Core collection NFT mint account
    #[account(
        constraint = core_collection_mint.key() == args.core_collection @ DepredictError::InvalidCollection
    )]
    pub core_collection_mint: AccountInfo<'info>,

    /// CHECK: Core collection asset account
    #[account(
        mut,
        constraint = core_collection_asset.key() == args.core_collection @ DepredictError::InvalidCollection
    )]
    pub core_collection_asset: AccountInfo<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + MarketCreator::INIT_SPACE,
        seeds = [MARKET_CREATOR.as_bytes(), &signer.key().to_bytes()],
        bump
    )]
    pub market_creator: Box<Account<'info, MarketCreator>>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: UpdateMarketCreatorArgs)]
pub struct UpdateMarketCreatorContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        constraint = market_creator.authority == signer.key() @ DepredictError::Unauthorized
    )]
    pub market_creator: Box<Account<'info, MarketCreator>>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateMarketCreatorContext<'info> {
    pub fn create_market_creator(&mut self, args: CreateMarketCreatorArgs) -> Result<()> {
        let market_creator = &mut self.market_creator;
        let ts = Clock::get()?.unix_timestamp;

        // Set market creator data
        market_creator.bump = 0; // Bump not critical for market creator functionality
        market_creator.authority = self.signer.key();
        market_creator.core_collection = args.core_collection;
        market_creator.collection_authority = args.collection_authority;
        market_creator.name = args.name;
        market_creator.created_at = ts;
        market_creator.num_markets = 0;
        market_creator.is_active = true;
        market_creator.version = 1;

        // Transfer market creator fee
        let fee = self.config.market_creator_fee;
        let transfer_result = transfer(
            CpiContext::new(self.system_program.to_account_info(), Transfer {
                from: self.signer.to_account_info(),
                to: self.fee_vault.to_account_info(),
            }),
            fee
        );

        if let Err(_) = transfer_result {
            return Err(DepredictError::InsufficientFunds.into());
        }

        msg!("Market creator created successfully");
        Ok(())
    }
}

impl<'info> UpdateMarketCreatorContext<'info> {
    pub fn update_market_creator(&mut self, args: UpdateMarketCreatorArgs) -> Result<()> {
        let market_creator = &mut self.market_creator;

        // Update fields if provided
        if let Some(name) = args.name {
            market_creator.name = name;
        }
        
        if let Some(is_active) = args.is_active {
            market_creator.is_active = is_active;
        }

        market_creator.next_version();

        msg!("Market creator updated successfully");
        Ok(())
    }
}
