use anchor_lang::prelude::*;
pub mod instructions;
pub mod state;
mod constants;
mod constraints;
mod errors;
mod events;


use state::*;
use instructions::*;
use errors::*;

declare_id!("7w43ZtEh1vdmiCFkuVMRni3s1gq7DJiu1N5N5AuRu59r");

#[program]
pub mod depredict {
    use super::*;

    // CONFIG INSTRUCTIONS
    pub fn initialize_config(ctx: Context<InitConfigContext>, fee_amount: u64, market_creator_fee: u64, collection_name: String, collection_uri: String) -> Result<()> {
        ctx.accounts.init_config(fee_amount, market_creator_fee, collection_name, collection_uri, &ctx.bumps)?;
        Ok(())
    }

    pub fn update_fee_amount(ctx: Context<UpdateConfigContext>, fee_amount: u64) -> Result<()> {
        ctx.accounts.update_fee_amount(fee_amount)?;
        Ok(())
    }

    pub fn update_market_creator_fee(ctx: Context<UpdateConfigContext>, market_creator_fee: u64) -> Result<()> {
        ctx.accounts.update_market_creator_fee(market_creator_fee)?;
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

    pub fn update_global_assets(ctx: Context<UpdateConfigContext>, global_tree: Pubkey) -> Result<()> {
        ctx.accounts.update_global_assets(global_tree)?;
        Ok(())
    }

    pub fn update_base_uri(ctx: Context<UpdateConfigContext>, base_uri: [u8; 200]) -> Result<()> {
        ctx.accounts.update_base_uri(base_uri)?;
        Ok(())
    }

    pub fn initialize_merkle_tree(ctx: Context<InitMerkleTreeContext>) -> Result<()> {
        ctx.accounts.init_merkle_tree(&ctx.bumps)?;
        Ok(())
    }

    pub fn close_config(ctx: Context<CloseConfigContext>) -> Result<()> {
        ctx.accounts.close_config()?;
        Ok(())
    }

    // MARKET CREATOR INSTRUCTIONS
    pub fn create_market_creator(ctx: Context<CreateMarketCreatorContext>, args: CreateMarketCreatorArgs) -> Result<()> {
        ctx.accounts.create_market_creator(args)?;
        Ok(())
    }

    pub fn update_market_creator(ctx: Context<UpdateMarketCreatorContext>, args: UpdateMarketCreatorArgs) -> Result<()> {
        ctx.accounts.update_market_creator(args)?;
        Ok(())
    }

    // MARKET INSTRUCTIONS

    pub fn create_market(ctx: Context<MarketContext>, args: CreateMarketArgs) -> Result<()> {
        ctx.accounts.create_market(args)?;
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

    pub fn create_sub_position_account(ctx: Context<SubPositionContext>, sub_position_key: Pubkey) -> Result<()> {
        ctx.accounts.create_sub_position_account(sub_position_key, &ctx.bumps)?;
        Ok(())
    }

    pub fn create_position(ctx: Context<PositionContext>, args: OpenPositionArgs) -> Result<()> {
        ctx.accounts.open_position(args)?;
        Ok(())
    }

    pub fn settle_position(ctx: Context<PayoutNftContext>, args: ClaimPositionArgs) -> Result<()> {
        ctx.accounts.payout_position(args)?;
        Ok(())
    }

    pub fn confirm_position(ctx: Context<ConfirmPositionContext>, args: ConfirmPositionArgs) -> Result<()> {
        // Only market authority can confirm
        require!(ctx.accounts.market.market_creator == *ctx.accounts.signer.key, DepredictError::Unauthorized);
        let page = &mut ctx.accounts.position_page;
        let slot_index = args.slot_index as usize;
        require!(slot_index < POSITION_PAGE_ENTRIES, DepredictError::PositionNotFound);
        page.entries[slot_index].leaf_index = args.leaf_index;
        page.entries[slot_index].status = PositionStatus::Open; // stays Open but now confirmed by having leaf_index
        Ok(())
    }
}

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "dePredict",
    project_url: "https://github.com/endcorp-hq/depredict",
    contacts: "email:security@endcorp.co",
    policy: "https://github.com/endcorp-hq/depredict",

    // Optional Fields
    preferred_languages: "en",
    source_code: "https://github.com/endcorp-hq/depredict",
    source_revision: "5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r"
}