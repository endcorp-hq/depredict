use anchor_lang::prelude::*;
use crate::state::{MarketCreator, CreateMarketCreatorArgs, VerifyMarketCreatorArgs};
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
pub struct UpdateMarketCreatorTreeContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        constraint = market_creator.authority == signer.key() @ DepredictError::Unauthorized
    )]
    pub market_creator: Box<Account<'info, MarketCreator>>,

    /// CHECK: Global Merkle Tree account reference (created off-chain)
    #[account(mut)]
    pub merkle_tree: AccountInfo<'info>,
    
    /// CHECK: Tree Config PDA - we'll validate its authority
    #[account(
        mut,
        seeds = [
            merkle_tree.key().as_ref()
        ],
        seeds::program = mpl_bubblegum::ID,
        bump
    )]
    pub tree_config: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct UpdateMarketCreatorDetailsContext<'info> {
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

    /// CHECK: Merkle Tree account - we'll verify it exists
    #[account(
        constraint = merkle_tree.key() == args.merkle_tree @ DepredictError::InvalidTree
    )]
    pub merkle_tree: AccountInfo<'info>,

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
            merkle_tree: Pubkey::default(), // Will be set during verification
            name: args.name,
            created_at: ts,
            num_markets: 0,
            active_markets: 0,
            pages_allocated: 0,
            fee_vault: args.fee_vault,
            creator_fee_bps: args.creator_fee_bps,
            verified: false, // Not verified until collection and merkle tree are created
        });

        msg!("Market creator created successfully (unverified)");
        Ok(())
    }
}

impl<'info> UpdateMarketCreatorDetailsContext<'info> {

    pub fn update_creator_name(&mut self, name: String) -> Result<()> {
        let market_creator = &mut self.market_creator;

        // Update fields if provided
        require!(
            market_creator.authority == *self.signer.key,
            DepredictError::Unauthorized
        );
        market_creator.name = name;
 
        Ok(())
    }

    pub fn update_creator_fee_vault(&mut self, current_fee_vault: Pubkey, new_fee_vault: Pubkey) -> Result<()> {
        let market_creator = &mut self.market_creator;
        require!(
            market_creator.authority == *self.signer.key,
            DepredictError::Unauthorized
        );

        require!(
            current_fee_vault != new_fee_vault,
            DepredictError::SameFeeVault
        );

        require!(
            current_fee_vault == market_creator.fee_vault,
            DepredictError::InvalidFeeVault
        );

        market_creator.fee_vault = new_fee_vault;
        msg!("Fee vault updated to {}", new_fee_vault);
        Ok(())
    }

    pub fn update_creator_fee(&mut self, creator_fee: u16) -> Result<()> {
        let market_creator = &mut self.market_creator;
        require!(
            market_creator.authority == *self.signer.key,
            DepredictError::Unauthorized
        );

        require!(
            creator_fee <= MAX_FEE_AMOUNT,
            DepredictError::InvalidFeeAmount
        );

        market_creator.creator_fee_bps = creator_fee;

        Ok(())
    }

    

}

impl<'info> UpdateMarketCreatorTreeContext<'info> {
    pub fn update_merkle_tree(
        &mut self,
        new_tree: Pubkey,
    ) -> Result<()> {
        
        let market_creator = &mut self.market_creator;
        let tree_config_data = self.tree_config.data.borrow();

        // check that the signer is the authority
        require!(
            market_creator.authority == *self.signer.key,
            DepredictError::Unauthorized
        );
        
        // check that the tree_config account exists and has data
        require!(
            tree_config_data.len() > 0,
            DepredictError::InvalidTree
        );

        // Extract tree_creator directly from the TreeConfig account data
        let tree_creator_bytes = &tree_config_data[8..40];
            
        match Pubkey::try_from_slice(tree_creator_bytes) {
            Ok(tree_creator) => {                        
                // Validate tree authority matches our program's authority
                require!(
                    tree_creator == market_creator.authority,
                    DepredictError::Unauthorized
                );
                
                // Update the merkle tree reference
                market_creator.merkle_tree = new_tree;

                return Ok(());
            },
            Err(_) => {
                return Err(DepredictError::Unauthorized.into());
            }
        }

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

        // add check for merkle tree account exists and is owned by the correct program
        // let merkle_tree_account = self.merkle_tree.try_borrow_data()?;
        // require!(
        //     merkle_tree_account.len() > 0,
        //     DepredictError::InvalidTree
        // );
        // require!(
        //     merkle_tree_account.len() == 32,
        //     DepredictError::InvalidTree
        // );
        // require!(
        //     merkle_tree_account[0] == 0,
        //     DepredictError::InvalidTree
        // );

        // Set the collection and mark as verified
        market_creator.core_collection = args.core_collection;
        market_creator.merkle_tree = args.merkle_tree;
        market_creator.verified = true;

        msg!("Market creator verified successfully with collection: {}", args.core_collection);
        Ok(())
    }
}
