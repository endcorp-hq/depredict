
use anchor_lang::prelude::*;
use crate::{constants::{USER, USER_TRADE}, errors::ShortxError, state::{CreateUserArgs, Order, User, UserTrade}};

#[derive(Accounts)]
pub struct UserContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + User::INIT_SPACE,
        seeds = [USER.as_bytes(), signer.key.as_ref()],
        bump
    )]
    pub user: Account<'info, User>,

    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct UserTradeContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + UserTrade::INIT_SPACE,
        seeds = [USER_TRADE.as_bytes(), signer.key.as_ref()],
        bump
    )]
    pub user_trade: Box<Account<'info, UserTrade>>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(sub_user_key: Pubkey)]
pub struct SubUserTradeContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_TRADE.as_bytes(), signer.key.as_ref()],
        bump,
        constraint = user_trade.is_sub_user == false @ ShortxError::UserTradeIsSubUser
    )]
    pub user_trade: Box<Account<'info, UserTrade>>,

    #[account(
        init,
        payer = signer,
        space = 8 + UserTrade::INIT_SPACE,
        seeds = [USER_TRADE.as_bytes(), sub_user_key.key().as_ref()],
        bump
    )]
    pub sub_user_trade: Box<Account<'info, UserTrade>>,

    pub system_program: Program<'info, System>,
}

impl<'info> UserContext<'info> {
    pub fn create_user(&mut self, args: CreateUserArgs, bumps: &UserContextBumps) -> Result<()> {
        let user = &mut self.user;

        require!(args.id != 0, ShortxError::Unauthorized);
        user.bump = bumps.user;
        user.authority = *self.signer.key;
        user.id = args.id;
        
        Ok(())
    }
}

impl<'info> UserTradeContext<'info> {
    pub fn create_user_trade(
        &mut self,
        bumps: &UserTradeContextBumps
    ) -> Result<()> {
        let user_trade = &mut self.user_trade;
    
        user_trade.set_inner(UserTrade {
            bump: bumps.user_trade,
            authority: self.signer.key(),
            total_deposits: 0,
            total_withdraws: 0,
            version: 0,
            orders: [Order::default(); 10],
            nonce: 0,
            is_sub_user: false,
            padding: [0; 25],
        });
    
        Ok(())
    }
}

impl<'info> SubUserTradeContext<'info> {
    pub fn create_sub_user_trade(
        &mut self,
        _sub_user_key: Pubkey,
        bumps: &SubUserTradeContextBumps
    ) -> Result<()> {
        let user_trade = &mut self.user_trade;
        let sub_user_trade = &mut self.sub_user_trade;
    
        let nonce = user_trade.nonce.checked_add(1).unwrap();
    
        user_trade.nonce = nonce;
    
        sub_user_trade.set_inner(UserTrade {
            bump: bumps.user_trade,
            authority: self.signer.key(),
            total_deposits: 0,
            total_withdraws: 0,
            version: 0,
            orders: [Order::default(); 10],
            nonce,
            is_sub_user: true,
            padding: [0; 25],
        });
    
        Ok(())
    }
}