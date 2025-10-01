use crate::constants::{CONFIG, MAX_FEE_AMOUNT};
use crate::errors::DepredictError;
use crate::state::Config;
use anchor_lang::prelude::*;


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
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: legacy config account, authority verified from bytes
    #[account(
        mut,
        seeds = [CONFIG.as_bytes()],
        bump
    )]
    pub config: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitConfigContext<'info> {
    pub fn init_config(&mut self, fee_amount: u16, bump: &InitConfigContextBumps) -> Result<()> {

        require!(
            fee_amount <= MAX_FEE_AMOUNT,
            DepredictError::InvalidFeeAmount
        );

        let config = &mut self.config;
        config.bump = bump.config;
        config.authority = *self.signer.key;
        config.fee_vault = *self.fee_vault.key;
        config.fee_amount = fee_amount;
        config.version = 1;
        config.global_markets = 0;
        config.base_uri = [0; 200];
        Ok(())
    }
}

impl<'info> UpdateConfigContext<'info> {
    pub fn update_fee_amount(
        &mut self,
        fee_amount: u16,
    ) -> Result<()> {
        let config = &mut self.config;
        require!(
            config.authority == *self.signer.key,
            DepredictError::Unauthorized
        );

        require!(
            config.fee_amount != fee_amount,
            DepredictError::SameFeeAmount
        );

        require!(
            fee_amount <= MAX_FEE_AMOUNT,
            DepredictError::InvalidFeeAmount
        );

        config.fee_amount = fee_amount;
        config.version = config.version.checked_add(1).unwrap();
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
        // Read authority (and optionally global_markets) within a narrow scope to drop borrows
        let (authority, global_markets_zero) = {
            // Read authority from raw bytes: discriminator (8) + bump (1) + authority (32)
            let data = self.config.try_borrow_data()?;
            require!(data.len() >= 8 + 1 + 32, DepredictError::Unauthorized);

            let mut authority_bytes = [0u8; 32];
            authority_bytes.copy_from_slice(&data[8 + 1..8 + 1 + 32]);
            let authority = Pubkey::new_from_array(authority_bytes);

            // Optional guard: if we can read global_markets, ensure it is zero
            // Field offsets (after 8-byte discriminator):
            // 0: bump (1)
            // 1..33: authority (32)
            // 33..65: fee_vault (32)
            // 65..67: fee_amount (u16)
            // 67..69: version (u16)
            // 69..77: next_market_id (u64)
            // 77..85: padding/alignment (conservative)
            // 85..93: global_markets (u64)
            let global_markets_offset = 8 + 85;
            let gm_zero = if data.len() >= global_markets_offset + 8 {
                let mut gm_bytes = [0u8; 8];
                gm_bytes.copy_from_slice(&data[global_markets_offset..global_markets_offset + 8]);
                u64::from_le_bytes(gm_bytes) == 0
            } else {
                // If field doesn't exist (older layout), treat as zero/allow close
                true
            };

            (authority, gm_zero)
        };

        require!(authority == *self.signer.key, DepredictError::Unauthorized);
        require!(global_markets_zero, DepredictError::ConfigInUse);

        // Transfer lamports to the signer
        let lamports = self.config.lamports();
        **self.config.try_borrow_mut_lamports()? = 0;
        **self.signer.try_borrow_mut_lamports()? = self
            .signer
            .lamports()
            .checked_add(lamports)
            .ok_or(DepredictError::ArithmeticOverflow)?;

        // Close the account
        self.config.assign(&System::id());
        self.config.resize(0)?;

        Ok(())
    }
}