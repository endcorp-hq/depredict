use crate::constants::{CONFIG, NFT_COLLECTION};
use crate::errors::DepredictError;
use crate::state::Config;
use anchor_lang::prelude::*;
use mpl_core::{
    ID as MPL_CORE_ID,
    instructions::CreateCollectionV2CpiBuilder,
};

#[derive(Accounts)]
pub struct InitConfigContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: This is safe because the fee vault is a multisig account that already exists
    #[account(mut)]
    pub fee_vault: AccountInfo<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG.as_bytes()],
        bump
    )]
    pub config: Box<Account<'info, Config>>,
    /// CHECK: Global collection PDA created via CPI to MPL Core
    #[account(
        mut,
        seeds = [NFT_COLLECTION.as_bytes(), b"global"],
        bump
    )]
    pub collection: UncheckedAccount<'info>,

    /// CHECK: MPL Core program id check
    #[account(
        address = MPL_CORE_ID,
        constraint = mpl_core_program.key() == MPL_CORE_ID @ DepredictError::InvalidMplCoreProgram
    )]
    pub mpl_core_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct UpdateConfigContext<'info> {

    #[account(
        mut,
        constraint = signer.key() == config.authority
    )]
    pub signer: Signer<'info>,

    /// CHECK: This is safe because the fee vault is a multisig account that already exists
    #[account(
        mut,
        constraint = fee_vault.key() == config.fee_vault
    )]
    pub fee_vault: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [CONFIG.as_bytes()],
        bump = config.bump,
        constraint = signer.key() == config.authority
    )]
    pub config: Box<Account<'info, Config>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseConfigContext<'info> {
    #[account(
        mut,
        constraint = signer.key() == config.authority @ DepredictError::Unauthorized
    )]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG.as_bytes()],
        bump = config.bump,
        close = signer
    )]
    pub config: Box<Account<'info, Config>>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitConfigContext<'info> {
    pub fn init_config(&mut self, fee_amount: u64, collection_name: String, collection_uri: String, bump: &InitConfigContextBumps) -> Result<()> {
        let config = &mut self.config;
        config.bump = bump.config;
        config.authority = *self.signer.key;
        config.fee_vault = *self.fee_vault.key;
        config.fee_amount = fee_amount;
        config.version = 1;
        config.next_market_id = 1;
        config.num_markets = 0;
        config.global_collection = Pubkey::default();
        config.global_tree = Pubkey::default();

        // Create a global Core collection now (owner/update authority = config)
        let payer = &self.signer.to_account_info();
        let system_program = &self.system_program.to_account_info();
        let mpl_core_program = &self.mpl_core_program.to_account_info();

        let collection_signer_seeds: &[&[u8]] = &[
            NFT_COLLECTION.as_bytes(),
            b"global",
            &[bump.collection],
        ];

        CreateCollectionV2CpiBuilder::new(mpl_core_program)
            .collection(&self.collection.to_account_info())
            .payer(payer)
            .update_authority(Some(&config.to_account_info()))
            .system_program(system_program)
            .name(collection_name)
            .uri(collection_uri)
            .invoke_signed(&[collection_signer_seeds])?;

        config.global_collection = self.collection.key();
        Ok(())
    }
}

impl<'info> UpdateConfigContext<'info> {
    pub fn update_fee_amount(
        &mut self,
        fee_amount: u64,
    ) -> Result<()> {
        let config = &mut self.config;
        require!(
            config.authority == *self.signer.key,
            DepredictError::Unauthorized
        );

        const MAX_FEE_AMOUNT: u64 = 1_000_000_000; // 1 billion
        require!(
            fee_amount <= MAX_FEE_AMOUNT,
            DepredictError::InvalidFeeAmount
        );

        require!(
            config.fee_amount != fee_amount,
            DepredictError::SameFeeAmount
        );

        config.fee_amount = fee_amount;
        config.version = config.version.checked_add(1).unwrap();
        msg!("Fee amount updated to {}", fee_amount);
        Ok(())
    }

    pub fn update_authority(
        &mut self,
        authority: Pubkey,
    ) -> Result<()> {
        let config = &mut self.config;
        
        require!(
            config.authority == *self.signer.key,
            DepredictError::Unauthorized
        );

        config.authority = authority;
        config.version = config.version.checked_add(1).unwrap();
        msg!("Authority updated to {}", authority);
        Ok(())
    }

    pub fn update_fee_vault(
        &mut self,
        fee_vault: Pubkey,
    ) -> Result<()> {
        let config = &mut self.config;
        require!(
            config.authority == *self.signer.key,
            DepredictError::Unauthorized
        );

        require!(
            fee_vault != config.fee_vault,
            DepredictError::SameFeeVault
        );

        config.fee_vault = fee_vault;
        config.version = config.version.checked_add(1).unwrap();

        msg!("Fee vault updated to {}", fee_vault);
        Ok(())
    }

    pub fn update_global_assets(
        &mut self,
        global_collection: Pubkey,
        global_tree: Pubkey,
    ) -> Result<()> {
        let config = &mut self.config;
        require!(
            config.authority == *self.signer.key,
            DepredictError::Unauthorized
        );

        require!(global_collection != Pubkey::default(), DepredictError::InvalidMplCoreProgram);
        require!(global_tree != Pubkey::default(), DepredictError::InvalidOracle);

        // Only update if changes provided
        let mut changed = false;
        if config.global_collection != global_collection {
            config.global_collection = global_collection;
            changed = true;
        }
        if config.global_tree != global_tree {
            config.global_tree = global_tree;
            changed = true;
        }
        if changed {
            config.version = config.version.checked_add(1).unwrap();
        }

        msg!("Global assets updated: collection={}, tree={}", global_collection, global_tree);
        Ok(())
    }
}

impl<'info> CloseConfigContext<'info> {
    pub fn close_config(&mut self) -> Result<()> {

        let config = &mut self.config;
        require!(
            config.num_markets == 0,
            DepredictError::ConfigInUse
        );
        // Transfer lamports to the signer
        let lamports = self.config.to_account_info().lamports();
        **self.config.to_account_info().try_borrow_mut_lamports()? = 0;
        **self.signer.try_borrow_mut_lamports()? = self.signer.lamports().checked_add(lamports)
            .ok_or(DepredictError::ArithmeticOverflow)?;

        // Close the account
        self.config.to_account_info().assign(&System::id());
        self.config.to_account_info().resize(0)?;

        Ok(())
    }
}
