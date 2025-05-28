use anchor_lang::prelude::*;
pub mod instructions;
pub mod state;
mod constants;
mod constraints;
mod errors;
mod events;


use state::*;
use instructions::*;

declare_id!("3AhNo8g3CQ5EdLjYurtAodG7Zrbkv3aj94L1yiw8m9s6");

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

    pub fn create_user(ctx: Context<UserContext>, args: CreateUserArgs) -> Result<()> {
        ctx.accounts.create_user(args, &ctx.bumps)?;
        Ok(())
    }

    pub fn create_user_trade(ctx: Context<UserTradeContext>) -> Result<()> {
        ctx.accounts.create_user_trade(&ctx.bumps)?;
        Ok(())
    }

    pub fn create_sub_user_trade(ctx: Context<SubUserTradeContext>, sub_user_key: Pubkey) -> Result<()> {
        ctx.accounts.create_sub_user_trade(sub_user_key, &ctx.bumps)?;
        Ok(())
    }

    pub fn create_order(ctx: Context<OrderContext>, args: OpenOrderArgs) -> Result<()> {
        ctx.accounts.open_order(args)?;
        Ok(())
    }


    pub fn settle_order(ctx: Context<OrderContext>, order_id: u64) -> Result<()> {
        ctx.accounts.payout_order(order_id)?;
        Ok(())
    }
}

