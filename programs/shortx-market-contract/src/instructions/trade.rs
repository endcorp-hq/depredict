use anchor_lang::prelude::*;
use anchor_lang::system_program::{ transfer, Transfer };
use anchor_spl::token::Token;
use anchor_spl::token_2022::{ transfer_checked, Token2022, TransferChecked };
use anchor_spl::{ associated_token::AssociatedToken, token_interface::{ Mint, TokenAccount } };
use mpl_token_metadata::instructions::BurnNftCpiBuilder;
use std::str::FromStr;

use crate::constants::{MARKET, USDC_MINT};
use crate::state::{Config, MarketStates, OpenPositionArgs, PayoutNftArgs, Position, PositionAccount, PositionDirection, PositionStatus};
use crate::{
    errors::ShortxError,
    state::{ MarketState, WinningDirection },
};

#[derive(Accounts)]
pub struct OrderContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: multisig fee vault account
    #[account(
        mut, 
        constraint = fee_vault.key() == config.fee_vault @ ShortxError::InvalidFeeVault
    )]
    pub fee_vault: AccountInfo<'info>,

    #[account(
        mut,
        constraint = position_account.market_id == market.market_id @ ShortxError::InvalidMarketId
    )]
    pub position_account: Box<Account<'info, PositionAccount>>,

    #[account(mut)]
    pub market: Box<Account<'info, MarketState>>,

    #[account(
        mut, 
        constraint = mint.key() == Pubkey::from_str(USDC_MINT).unwrap() @ ShortxError::InvalidMint
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program
    )]
    pub user_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    pub config: Box<Account<'info, Config>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PayoutNftContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub market: Box<Account<'info, MarketState>>,

    #[account(
        mut,
        constraint = position_account.market_id == market.market_id @ ShortxError::InvalidMarketId
    )]
    pub position_account: Box<Account<'info, PositionAccount>>,

    #[account(
        mut, 
        constraint = mint.key() == Pubkey::from_str(USDC_MINT).unwrap() @ ShortxError::InvalidMint
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// CHECK: Check by CPI
    pub master_edition: AccountInfo<'info>,

    /// CHECK: Check by CPI
    pub collection_metadata_account: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program
    )]
    pub user_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: We verify ownership through token account
    #[account(mut)]
    pub nft_mint: AccountInfo<'info>,

    /// CHECK: Burn expects type of accountInfo so I guess checking happens in the CPI
    #[account(
        mut
    )]
    pub nft_token_account: AccountInfo<'info>,

    /// CHECK: Verified by CPI
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,

    /// CHECK: Check by CPI
    pub token_metadata_program: AccountInfo<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


impl<'info> OrderContext<'info> {
    pub fn open_order(&mut self, args: OpenPositionArgs) -> Result<()> {
        let market = &mut self.market;
        let position_account = &mut self.position_account;
    
        let ts = Clock::get()?.unix_timestamp;
    
        // Add logs for timestamp comparison
        msg!("Current cluster timestamp (ts): {}", ts);
        msg!("Market start timestamp (market.market_start): {}", market.market_start);
        msg!("Is ts > market.market_start? {}", ts > market.market_start);

        require!(ts > market.market_start, ShortxError::QuestionPeriodNotStarted);
        require!(market.market_end > ts, ShortxError::QuestionPeriodEnded);
        require!(
            market.winning_direction == WinningDirection::None,
            ShortxError::MarketAlreadyResolved
        );
    
        // this ensures multiple orders are not created at the same time
        require!(ts > market.update_ts, ShortxError::ConcurrentTransaction);
    
        let net_amount = args.amount;
    
        let ( current_liquidity, otherside_current_liquidity) = match args.direction {
            PositionDirection::Yes => (market.yes_liquidity, market.no_liquidity),
            PositionDirection::No => (market.no_liquidity, market.yes_liquidity),
        };
        msg!("current liquidity {:?}", current_liquidity);
        msg!("otherside current liquidity {:?}", otherside_current_liquidity);
        msg!("Net Amount {:?}", net_amount);
    
        let new_directional_liquidity = current_liquidity.checked_add(net_amount).unwrap();
        msg!("new directional liquidity {:?}", new_directional_liquidity);
        let markets_liquidity = new_directional_liquidity
            .checked_add(otherside_current_liquidity)
            .unwrap();
        msg!("markets liquidity {:?}", markets_liquidity);
        
        // Add debug logging for positions
        msg!("Checking position slots:");
        for (i, pos) in position_account.positions.iter().enumerate() {
            msg!("Position {}: status = {:?}", i, pos.position_status);
        }
    
        let position_index = position_account.positions
            .iter()
            .position(
                |order|
                    order.position_status == PositionStatus::Init
            )
            .ok_or(ShortxError::NoAvailableOrderSlot)?;
    
            
        msg!("Position Index {:?}", position_index);

        let position_nonce = position_account.get_position_nonce();
        msg!("Position Nonce {:?}", position_nonce);
        position_account.positions[position_index] = Position {
            ts,
            position_id: market.next_position_id(),
            market_id: market.market_id,
            position_status: PositionStatus::Open,
            amount: net_amount,
            direction: args.direction,
            is_nft: false,
            mint: None,
            authority: Some(self.signer.key()),
            created_at: ts,
            version: 0,
            padding: [0; 10],
        };
    
        market.volume = market.volume.checked_add(net_amount).unwrap();

        match args.direction {
            PositionDirection::Yes => {
                market.yes_liquidity = market.yes_liquidity.checked_add(net_amount).unwrap();
            }
            PositionDirection::No => {
                market.no_liquidity = market.no_liquidity.checked_add(net_amount).unwrap();
            }
        }
       
        msg!("Transfer Checked, net_amount {:?}, mint {:?}, to {:?}, authority {:?}, balance {:?}, user balance {:?}", net_amount, self.mint.to_account_info(), self.market_vault.to_account_info(), self.signer.to_account_info(), self.market_vault.amount, self.user_ata.amount);
        transfer_checked(
            CpiContext::new(self.token_program.to_account_info(), TransferChecked {
                from: self.user_ata.to_account_info(),
                mint: self.mint.to_account_info(),
                to: self.market_vault.to_account_info(),
                authority: self.signer.to_account_info(),
            }),
            net_amount,
            self.mint.decimals
        )?;
    
        let current_position = position_account.positions[position_index];
    
        position_account.emit_position_event(current_position)?;
    
        let fee = self.config.fee_amount;
    
        let transfer_result = transfer(
            CpiContext::new(self.system_program.to_account_info(), Transfer {
                from: self.signer.to_account_info(),
                to: self.fee_vault.to_account_info(),
            }),
            fee
        );
    
        if let Err(_) = transfer_result {
            return Err(ShortxError::InsufficientFunds.into());
        }
    
        require!(ts > market.update_ts, ShortxError::ConcurrentTransaction);
    
        market.update_ts = ts;
    
        market.emit_market_event()?;
    
        Ok(())
    }


    pub fn payout_order(&mut self, position_id: u64) -> Result<()> {
        let market = &mut self.market;
        let position_account = &mut self.position_account;
        let ts = Clock::get()?.unix_timestamp;
    
        require!(
            market.winning_direction != WinningDirection::None,
            ShortxError::MarketStillActive
        );
        require!(market.market_state == MarketStates::Resolved, ShortxError::MarketNotAllowedToPayout);

    
        let position_index = position_account.positions
            .iter()
            .position(|order| {
                order.position_id == position_id &&
                    order.position_status == PositionStatus::Open &&
                    order.market_id == market.market_id
            })
            .ok_or(ShortxError::OrderNotFound)?;
    
        let position = position_account.positions[position_index];
    
        let is_winner = match (position.direction, market.winning_direction) {
            | (PositionDirection::Yes, WinningDirection::Yes)
            | (PositionDirection::No, WinningDirection::No) => true,
            _ => false,
        };
    
        let mut payout = 0;
    
        if is_winner {
            let winning_liquidity_percentage = position.amount.checked_div(market.yes_liquidity).unwrap();
            payout = market.no_liquidity.checked_mul(winning_liquidity_percentage).unwrap() + position.amount;
        }
    
        
        if payout > 0 && is_winner {
            let signer: &[&[&[u8]]] = &[&[b"market", &market.market_id.to_le_bytes(), &[market.bump]]];
    
            
                transfer_checked(
                    CpiContext::new_with_signer(
                        self.token_program.to_account_info(),
                        TransferChecked {
                            from: self.market_vault.to_account_info(),
                            mint: self.mint.to_account_info(),
                            to: self.user_ata.to_account_info(),
                            authority: market.to_account_info(),
                        },
                        signer
                    ),
                    payout,
                    self.mint.decimals
                )?;
                
            msg!("Market Liquidity {:?}", self.market_vault.amount);
            msg!("Order Price {:?}", position.amount);
            msg!("Payout {:?}", payout);
        }
    
        position_account.positions[position_index].position_status = PositionStatus::Closed;
        position_account.positions[position_index].ts = ts;
    
        position_account.emit_position_event(position_account.positions[position_index])?;
    
        require!(ts > market.update_ts, ShortxError::ConcurrentTransaction);
    
        market.update_ts = ts;
    
        market.emit_market_event()?;
    
        Ok(())
    }
}


impl<'info> PayoutNftContext<'info> {
    pub fn payout_nft(&mut self, args: PayoutNftArgs) -> Result<()> {
        let market = &mut self.market;
        let position_account = &mut self.position_account;
        let ts = Clock::get()?.unix_timestamp;

        // Check market is resolved
        require!(
            market.winning_direction != WinningDirection::None,
            ShortxError::MarketStillActive
        );
        require!(market.market_state == MarketStates::Resolved, ShortxError::MarketNotAllowedToPayout);


        // Verify market ID matches
        require!(args.market_id == market.market_id, ShortxError::InvalidMarketId);

        // Find position with this position ID
        let position_index = position_account.positions
            .iter()
            .position(|pos| {
                pos.position_id == args.position_id &&
                pos.mint == Some(self.nft_mint.key()) && //check that the nft mint is the same as the one in the position
                pos.is_nft &&
                pos.position_status == PositionStatus::Open &&
                pos.amount == args.amount
            })
            .ok_or(ShortxError::OrderNotFound)?;

        let position = position_account.positions[position_index];

        // Check if position won
        let is_winner = match (position.direction, market.winning_direction) {
            (PositionDirection::Yes, WinningDirection::Yes) |
            (PositionDirection::No, WinningDirection::No) => true,
            _ => false,
        };

        
        let mut payout = 0;
        if is_winner {

            let (winning_liquidity, otherside_liquidity) = match args.direction {
                PositionDirection::Yes => (market.yes_liquidity, market.no_liquidity),
                PositionDirection::No => (market.no_liquidity, market.yes_liquidity),
            };
            
            let winning_liquidity_percentage = position.amount.checked_div(winning_liquidity).unwrap();
            payout = otherside_liquidity.checked_mul(winning_liquidity_percentage).unwrap() + position.amount;
        }

        if payout > 0 && is_winner {
            // Transfer payout
            let signer: &[&[&[u8]]] = &[&[b"market", &market.market_id.to_le_bytes(), &[market.bump]]];
            transfer_checked(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: self.market_vault.to_account_info(),
                        mint: self.mint.to_account_info(),
                        to: self.user_ata.to_account_info(),
                        authority: market.to_account_info(),
                    },
                    signer
                ),
                payout,
                self.mint.decimals
            )?;

            // Burn the NFT
            BurnNftCpiBuilder::new(&self.token_metadata_program)
            .metadata(&self.metadata_account)
            // if your NFT is part of a collection you will need to pass in the collection metadata address.
            .collection_metadata(Some(&self.collection_metadata_account))
            .owner(&self.signer)
            .mint(&self.nft_mint)
            .token_account(&self.nft_token_account)
            .master_edition_account(&self.master_edition)
            .spl_token_program(&self.token_2022_program)
            .invoke()?;
        }

        // Update position status
        position_account.positions[position_index].position_status = PositionStatus::Closed;
        position_account.positions[position_index].ts = ts;
        position_account.emit_position_event(position_account.positions[position_index])?;

        require!(ts > market.update_ts, ShortxError::ConcurrentTransaction);
        market.update_ts = ts;
        market.emit_market_event()?;

        Ok(())
    }
}

