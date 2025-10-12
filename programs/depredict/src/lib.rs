use anchor_lang::prelude::*;
pub mod instructions;
pub mod state;
mod constants;
mod constraints;
mod errors;
mod events;
mod helpers;

use state::*;
use instructions::*;

declare_id!("deprZ6k7MU6w3REU6hJ2yCfnkbDvzUZaKE4Z4BuZBhU");

#[program]
pub mod depredict {
    use super::*;

    // CONFIG INSTRUCTIONS
    pub fn initialize_config(ctx: Context<InitConfigContext>, fee_amount: u16) -> Result<()> {
        ctx.accounts.init_config(fee_amount, &ctx.bumps)?;
        Ok(())
    }

    pub fn update_fee_amount(ctx: Context<UpdateConfigContext>, fee_amount: u16) -> Result<()> {
        ctx.accounts.update_fee_amount(fee_amount)?;
        Ok(())
    }

    pub fn update_authority(ctx: Context<UpdateConfigContext>, authority: Pubkey) -> Result<()> {
        ctx.accounts.update_authority(authority)?;
        Ok(())
    }

    pub fn update_fee_vault(ctx: Context<UpdateConfigContext>, fee_vault: Pubkey) -> Result<()> {
        ctx.accounts.update_fee_vault(fee_vault)?;
        Ok(())
    }

    pub fn update_base_uri(ctx: Context<UpdateConfigContext>, base_uri: [u8; 200]) -> Result<()> {
        ctx.accounts.update_base_uri(base_uri)?;
        Ok(())
    }

    pub fn close_config(ctx: Context<CloseConfigContext>) -> Result<()> {
        ctx.accounts.close_config()?;
        Ok(())
    }

    // MARKET CREATOR INSTRUCTIONS
    pub fn create_market_creator(ctx: Context<CreateMarketCreatorContext>, args: CreateMarketCreatorArgs) -> Result<()> {
        ctx.accounts.create_market_creator(args, &ctx.bumps)?;
        Ok(())
    }

    pub fn verify_market_creator(ctx: Context<VerifyMarketCreatorContext>, args: VerifyMarketCreatorArgs) -> Result<()> {
        ctx.accounts.verify_market_creator(args)?;
        Ok(())
    }

    pub fn update_creator_name(ctx: Context<UpdateMarketCreatorDetailsContext>, name: String) -> Result<()> {
        ctx.accounts.update_creator_name(name)?;
        Ok(())
    }

    pub fn update_creator_fee_vault(ctx: Context<UpdateMarketCreatorDetailsContext>, current_fee_vault: Pubkey, new_fee_vault: Pubkey) -> Result<()> {
        ctx.accounts.update_creator_fee_vault(current_fee_vault, new_fee_vault)?;
        Ok(())
    }

    pub fn update_creator_fee(ctx: Context<UpdateMarketCreatorDetailsContext>, creator_fee: u16) -> Result<()> {
        ctx.accounts.update_creator_fee(creator_fee)?;
        Ok(())
    }

    pub fn update_merkle_tree(ctx: Context<UpdateMarketCreatorTreeContext>, new_tree: Pubkey) -> Result<()> {
        ctx.accounts.update_merkle_tree(new_tree)?;
        Ok(())
    }

    // MARKET INSTRUCTIONS

    pub fn create_market(ctx: Context<CreateMarketContext>, args: CreateMarketArgs) -> Result<()> {
        ctx.accounts.create_market(args, &ctx.bumps)?;
        Ok(())
    }

    pub fn update_market(ctx: Context<UpdateMarketContext>, args: UpdateMarketArgs) -> Result<()> {
        ctx.accounts.update_market(args)?;
        Ok(())
    }
    
    pub fn resolve_market(ctx: Context<ResolveMarketContext>, args: ResolveMarketArgs) -> Result<()> {
        ctx.accounts.resolve_market(args)?;
        Ok(())
    }

    pub fn close_market(ctx: Context<CloseMarketContext>, args: CloseMarketArgs) -> Result<()> {
        ctx.accounts.close_market(args)?;
        Ok(())
    }

    // POSITION INSTRUCTIONS

    pub fn open_position(ctx: Context<OpenPositionContext>, args: OpenPositionArgs) -> Result<()> {
        ctx.accounts.open_position(args)?;
        Ok(())
    }

    pub fn settle_position(ctx: Context<SettlePositionContext>, args: SettlePositionArgs) -> Result<()> {
        ctx.accounts.settle_position(args)?;
        Ok(())
    }

    pub fn ensure_position_page(ctx: Context<EnsurePositionPageContext>, args: EnsurePageArgs) -> Result<()> {
        ctx.accounts.ensure(args)?;
        Ok(())
    }

    pub fn prune_position(ctx: Context<PrunePositionContext>, args: PrunePositionArgs) -> Result<()> {
        ctx.accounts.prune(args)?;
        Ok(())
    }

    pub fn close_position_page(ctx: Context<ClosePositionPageContext>, args: ClosePositionPageArgs) -> Result<()> {
        ctx.accounts.close_page(args)?;
        Ok(())
    }
}

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "dePredict",
    project_url: "https://depredict.xyz",
    contacts: "email:security@endcorp.co",
    policy: "https://depredict.xyz/policy",

    // Optional Fields
    preferred_languages: "en",
    source_code: "https://github.com/endcorp-hq/depredict",
    source_revision: "335a26b3b917f9902e530b9358dd686326b3c6fc"
}