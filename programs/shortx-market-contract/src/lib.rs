use anchor_lang::prelude::*;
pub mod instructions;
pub mod state;
mod constants;
mod constraints;
mod errors;
mod events;


use state::*;
use instructions::*;

declare_id!("HWEeUwnYT7PN5LdJ2t4dyYSqpEn1rcs9coFkqCqMuCiF");

#[program]
pub mod shortx_contract {
    use super::*;

    pub fn initialize_config(ctx: Context<InitConfigContext>, fee_amount: u64) -> Result<()> {
        ctx.accounts.init_config(fee_amount, &ctx.bumps)?;
        Ok(())
    }

    pub fn update_config(ctx: Context<UpdateConfigContext>, fee_amount: Option<u64>, authority: Option<Pubkey>, fee_vault: Option<Pubkey>) -> Result<()> {
        ctx.accounts.update_config(fee_amount, authority, fee_vault)?;
        Ok(())
    }

    pub fn close_config(ctx: Context<CloseConfigContext>) -> Result<()> {
        ctx.accounts.close_config()?;
        Ok(())
    }

    pub fn create_market(ctx: Context<MarketContext>, args: CreateMarketArgs) -> Result<()> {
        ctx.accounts.create_market(args, &ctx.bumps)?;
        Ok(())
    }

    pub fn update_market(ctx: Context<UpdateMarketContext>, args: UpdateMarketArgs) -> Result<()> {
        ctx.accounts.update_market(args)?;
        Ok(())
    }

    pub fn close_market(ctx: Context<CloseMarketContext>, args: CloseMarketArgs) -> Result<()> {
        ctx.accounts.close_market(args)?;
        Ok(())
    }

    pub fn resolve_market(ctx: Context<ResolveMarketContext>, args: ResolveMarketArgs) -> Result<()> {
        ctx.accounts.resolve_market(args)?;
        Ok(())
    }

    pub fn create_user(ctx: Context<UserContext>, args: CreateUserArgs) -> Result<()> {
        ctx.accounts.create_user(args, &ctx.bumps)?;
        Ok(())
    }


    pub fn create_sub_position_account(ctx: Context<SubPositionContext>, sub_position_key: Pubkey) -> Result<()> {
        ctx.accounts.create_sub_position_account(sub_position_key, &ctx.bumps)?;
        Ok(())
    }

    pub fn create_position(ctx: Context<PositionContext>, args: OpenPositionArgs) -> Result<()> {
        ctx.accounts.open_position(args, &ctx.bumps)?;
        Ok(())
    }

    pub fn settle_position(ctx: Context<PayoutNftContext>) -> Result<()> {
        ctx.accounts.payout_position()?;
        Ok(())
    }
}

