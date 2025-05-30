
use anchor_lang::prelude::*;
use crate::{constants::{USER}, errors::ShortxError, state::{CreateUserArgs, User}};

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
    pub user: Box<Account<'info, User>>,

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

