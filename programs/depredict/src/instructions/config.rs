use crate::constants::CONFIG;
use crate::errors::DepredictError;
use crate::state::Config;
use anchor_lang::prelude::*;
use mpl_bubblegum::accounts::TreeConfig;


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

    /// CHECK: Global Merkle Tree account reference (created off-chain)
    #[account(mut)]
    pub merkle_tree: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct UpdateConfigContext<'info> {

    #[account(
        mut,
        constraint = signer.key() == config.authority @ DepredictError::Unauthorized
    )]
    pub signer: Signer<'info>,

    /// CHECK: This is safe because the fee vault is a multisig account that already exists
    #[account(
        mut,
        constraint = fee_vault.key() == config.fee_vault
    )]
    pub fee_vault: AccountInfo<'info>,
    
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
    pub fn init_config(&mut self, fee_amount: u64, _collection_name: String, _collection_uri: String, bump: &InitConfigContextBumps) -> Result<()> {
        let config = &mut self.config;
        config.bump = bump.config;
        config.authority = *self.signer.key;
        config.fee_vault = *self.fee_vault.key;
        config.fee_amount = fee_amount;
        config.version = 1;
        config.next_market_id = 1;
        config.num_markets = 0;
        config.global_tree = Pubkey::default();
        config.base_uri = [0; 200];

        // Store provided global merkle tree reference (tree must be created off-chain)
        config.global_tree = self.merkle_tree.key();
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

        //TODO: Update authority of the Merkle Tree account too. 
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

    pub fn update_global_tree(
        &mut self,
        new_global_tree: Pubkey,
    ) -> Result<()> {
        let config = &mut self.config;
        require!(
            config.authority == *self.signer.key,
            DepredictError::Unauthorized
        );

        // For now, skip TreeConfig validation since the account might not exist yet
        // TODO: Implement proper TreeConfig validation once the account structure is confirmed
        msg!("Skipping TreeConfig validation for now - updating global tree directly");
        
        // Update the global tree reference
        config.global_tree = new_global_tree;
        config.version = config.version.checked_add(1).unwrap();
        msg!("Global tree updated: tree={}", new_global_tree);

        Ok(())
    }

    pub fn update_base_uri(
        &mut self,
        base_uri: [u8; 200],
    ) -> Result<()> {
        let config = &mut self.config;
        require!(
            config.authority == *self.signer.key,
            DepredictError::Unauthorized
        );
        config.base_uri = base_uri;
        config.version = config.version.checked_add(1).unwrap();
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
