use crate::constants::CONFIG;
use crate::errors::ShortxError;
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

impl<'info> InitConfigContext<'info> {
    pub fn init_config(&mut self, fee_amount: u64, bump: &InitConfigContextBumps) -> Result<()> {
        let config = &mut self.config;
        config.bump = bump.config;
        config.authority = *self.signer.key;
        config.fee_vault = *self.fee_vault.key;
        config.fee_amount = fee_amount;
        config.version = 1;
        Ok(())
    }
}

impl<'info> UpdateConfigContext<'info> {
    pub fn update_config(
        &mut self,
        fee_amount: Option<u64>, 
        authority: Option<Pubkey>,
        fee_vault: Option<Pubkey>,
    ) -> Result<()> {
        let config = &mut self.config;
        require!(
            config.authority == *self.signer.key,
            ShortxError::Unauthorized
        );

        if let Some(fee_amount) = fee_amount {
            config.fee_amount = fee_amount;
        }
        if let Some(authority) = authority {
            config.authority = authority;
        }
        if let Some(fee_vault) = fee_vault {
            require!(
                fee_vault == *self.fee_vault.key,
                ShortxError::InvalidFeeVault
            );
            config.fee_vault = fee_vault;
        }
        config.version = config.version.checked_add(1).unwrap();
        Ok(())
    }
}
