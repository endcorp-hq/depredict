use anchor_lang::prelude::*;
use crate::state::{MarketCreator, CreateMarketCreatorArgs, UpdateMarketCreatorArgs, VerifyMarketCreatorArgs};
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(args: CreateMarketCreatorArgs)]
pub struct CreateMarketCreatorContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

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

#[derive(Accounts)]
#[instruction(args: VerifyMarketCreatorArgs)]
pub struct VerifyMarketCreatorContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        constraint = market_creator.authority == signer.key() @ DepredictError::Unauthorized,
        constraint = !market_creator.verified @ DepredictError::AlreadyVerified
    )]
    pub market_creator: Box<Account<'info, MarketCreator>>,

    /// CHECK: Core collection NFT mint account - we'll verify it exists
    #[account(
        constraint = core_collection.key() == args.core_collection @ DepredictError::InvalidCollection
    )]
    pub core_collection: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateMarketCreatorContext<'info> {
    pub fn create_market_creator(&mut self, args: CreateMarketCreatorArgs, bump: &CreateMarketCreatorContextBumps) -> Result<()> {
        let market_creator = &mut self.market_creator;
        let auth = &self.signer;
        let ts = Clock::get()?.unix_timestamp;

        market_creator.set_inner(MarketCreator {
            bump: bump.market_creator,
            authority: auth.key(),
            core_collection: Pubkey::default(), // Will be set during verification
            name: args.name,
            created_at: ts,
            num_markets: 0,
            fee_vault: args.fee_vault,
            verified: false, // Not verified until collection is created
        });

        msg!("Market creator created successfully (unverified)");
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

        if let Some(fee_vault) = args.fee_vault {
            market_creator.fee_vault = fee_vault;
        }

        msg!("Market creator updated successfully");
        Ok(())
    }
}

impl<'info> VerifyMarketCreatorContext<'info> {
    pub fn verify_market_creator(&mut self, args: VerifyMarketCreatorArgs) -> Result<()> {
        let market_creator = &mut self.market_creator;

        // Verify the collection account exists and is owned by the correct program
        let collection_account = self.core_collection.try_borrow_data()?;
        require!(
            collection_account.len() > 0,
            DepredictError::InvalidCollection
        );

        // Set the collection and mark as verified
        market_creator.core_collection = args.core_collection;
        market_creator.verified = true;

        msg!("Market creator verified successfully with collection: {}", args.core_collection);
        Ok(())
    }
}
