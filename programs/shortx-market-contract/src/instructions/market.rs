use std::str::FromStr;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken, token_2022::TransferChecked, token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface}
};
use crate::{constants::{ MARKET, USDC_MINT}, state::{CloseMarketArgs, Config, MarketStates}};
use crate::{
    errors::ShortxError,
    state::{CreateMarketArgs, UpdateMarketArgs, MarketState},
};

#[derive(Accounts)]
#[instruction(args: CreateMarketArgs)]
pub struct MarketContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: fee vault account
    #[account(
        mut, 
        constraint = fee_vault.key() == config.fee_vault @ ShortxError::InvalidFeeVault
    )]
    pub fee_vault: AccountInfo<'info>,

    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = signer,
        space = 8 + MarketState::INIT_SPACE,
        seeds = [MARKET.as_bytes(), &args.market_id.to_le_bytes()],
        bump
    )]
    pub market: Box<Account<'info, MarketState>>,

    #[account(
        mut, 
        constraint = usdc_mint.key() == Pubkey::from_str(USDC_MINT).unwrap() @ ShortxError::InvalidMint
    )]
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = signer,
        associated_token::mint = usdc_mint,
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// Create a separate context for the update_market instruction
#[derive(Accounts)]
pub struct UpdateMarketContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)] // Market must exist already
    pub market: Box<Account<'info, MarketState>>,
    pub system_program: Program<'info, System>,
}

// Context for closing the market
#[derive(Accounts)]
#[instruction(args: CloseMarketArgs)] // Need args for seeds/constraints
pub struct CloseMarketContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: fee vault account where rent/tokens are sent
    #[account(
        mut, 
        constraint = fee_vault.key() == config.fee_vault @ ShortxError::InvalidFeeVault
    )]
    pub fee_vault: AccountInfo<'info>,

    pub config: Account<'info, Config>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = usdc_mint,
        associated_token::authority = fee_vault
    )]
    pub fee_vault_usdc_ata: InterfaceAccount<'info, TokenAccount>,

    // Market must exist and match args.market_id
    #[account(
        mut,
        seeds = [MARKET.as_bytes(), &args.market_id.to_le_bytes()],
        bump,
        constraint = market.market_state == MarketStates::Resolved @ ShortxError::MarketStillActive
    )]
    pub market: Box<Account<'info, MarketState>>,

    // Mint needed for ATA derivation and transfer checks
    #[account(
        mut, 
        constraint = usdc_mint.key() == Pubkey::from_str(USDC_MINT).unwrap() @ ShortxError::InvalidMint
    )]
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    // Market vault to close, must exist
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = market,
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> MarketContext<'info> {
    pub fn create_market(&mut self, args: CreateMarketArgs, bumps: &MarketContextBumps) -> Result<()> {
        let market = &mut self.market;
        let signer = &self.signer;
        let ts = Clock::get()?.unix_timestamp;

        // only the config authority can create a market
        require!(self.config.authority == *signer.key, ShortxError::Unauthorized);

        market.set_inner(MarketState {
            bump: bumps.market,
            authority: self.signer.key(),
            market_id: args.market_id,
            market_start: args.market_start,
            market_end: args.market_end,
            question: args.question,
            update_ts: ts,
            ..Default::default()
        });

        market.emit_market_event()?;

        Ok(())
    }
}

impl<'info> UpdateMarketContext<'info> {
    pub fn update_market(&mut self, args: UpdateMarketArgs) -> Result<()> {
        let market = &mut self.market;
        let signer = &self.signer;
        let ts = Clock::get()?.unix_timestamp;

        require!(market.authority == *signer.key, ShortxError::Unauthorized);

        if let Some(market_end) = args.market_end {
            market.market_end = market_end;
        }

        if let Some(winning_direction) = args.winning_direction {
            market.winning_direction = winning_direction;
        }

        if let Some(market_state) = args.state {
            market.market_state = market_state;
        }

        market.update_ts = ts;
        Ok(())
    }
}

impl<'info> CloseMarketContext<'info> {
    pub fn close_market(&mut self, args: CloseMarketArgs) -> Result<()> {

        let market = &mut self.market;
        let signer = &self.signer;

        require!(market.authority == *signer.key, ShortxError::Unauthorized);

        let market_state = market.market_state;
        require!(market_state == MarketStates::Resolved, ShortxError::MarketStillActive);

        let market_id = self.market.market_id;
        require!(market_id == args.market_id, ShortxError::InvalidMarketId);

        let market_id_bytes = args.market_id.to_le_bytes();
        let seeds = &[MARKET.as_bytes(), &market_id_bytes, &[self.market.bump]];
        let signer_seeds = &[&seeds[..]];

        // 1. Transfer remaining token liquidity (if any) from market vault to fee vault ATA
        if self.market_vault.amount > 0 {
            msg!("Transferring {} tokens from market vault before closing.", self.market_vault.amount);
            transfer_checked(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: self.market_vault.to_account_info(),
                        to: self.fee_vault_usdc_ata.to_account_info(),
                        authority: self.market.to_account_info(), // Market PDA is authority
                        mint: self.usdc_mint.to_account_info(),
                    },
                    signer_seeds,
                ),
                self.market_vault.amount,
                self.usdc_mint.decimals,
            )?;
        }

        // 2. Close the market's token ATA, sending its rent lamports to the fee_vault
        msg!("Closing market vault account: {}", self.market_vault.key());
        anchor_spl::token_interface::close_account(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                anchor_spl::token_interface::CloseAccount {
                    account: self.market_vault.to_account_info(),
                    destination: self.fee_vault.to_account_info(), // Lamport destination
                    authority: self.market.to_account_info(), // Market PDA is authority
                },
                signer_seeds
            )
        )?;

        // 3. Close the market state account itself, sending its rent lamports to the fee_vault
        // Anchor does this automatically if the account is mutable and owned by the program,
        // sending lamports to the payer (signer) by default. To send to fee_vault,
        // we need to transfer lamports *before* the instruction ends.
        
        let market_account_info = self.market.to_account_info();
        let fee_vault_info = self.fee_vault.to_account_info();
        let market_lamports = market_account_info.lamports();

        msg!("Closing market account: {}", market_account_info.key());
        msg!("Transferring {} lamports from market account to fee vault.", market_lamports);

        **market_account_info.try_borrow_mut_lamports()? -= market_lamports;
        **fee_vault_info.try_borrow_mut_lamports()? += market_lamports;

        // Mark the market account data as closed by zeroizing (optional but good practice)
        // market_account_info.assign(&System::id()); // This reassigns owner
        // market_account_info.realloc(0, false)?; // This might fail if rent epoch not met
        // A common way is to zero out the data manually if needed, 
        // but closing typically involves just reclaiming lamports.
        // Since Anchor doesn't have a direct `close_account_manually_to_recipient`,
        // transferring lamports like this is the way.
        // The account will be garbage collected eventually.

        Ok(())
    }
}
