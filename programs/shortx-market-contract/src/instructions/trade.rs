use anchor_lang::prelude::*;
use anchor_lang::system_program::{ transfer, Transfer };
use anchor_spl::token::{Token, TransferChecked, transfer_checked};

use anchor_spl::{ associated_token::AssociatedToken, token_interface::{ Mint, TokenAccount } };
use anchor_spl::{};

use mpl_token_metadata::instructions::{BurnNft, BurnNftCpiBuilder};
use switchboard_on_demand::prelude::rust_decimal::Decimal;

use std::str::FromStr;

use crate::constants::{USDC_MINT};
use crate::state::{Config, MarketStates, OpenPositionArgs, PayoutNftArgs, Position, PositionAccount, PositionDirection, PositionStatus};
use crate::{
    errors::ShortxError,
    state::{ MarketState, WinningDirection },
};

#[derive(Accounts)]
pub struct PositionContext<'info> {
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
        constraint = market_positions_account.market_id == market.market_id @ ShortxError::InvalidMarketId
    )]
    pub market_positions_account: Box<Account<'info, PositionAccount>>,

    #[account(mut)]
    pub market: Box<Account<'info, MarketState>>,

    #[account(
        mut, 
        constraint = usdc_mint.key() == Pubkey::from_str(USDC_MINT).unwrap() @ ShortxError::InvalidMint
    )]
    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = usdc_mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program
    )]
    pub user_usdc_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub market_usdc_vault: Box<InterfaceAccount<'info, TokenAccount>>,

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
        constraint = market_positions_account.market_id == market.market_id @ ShortxError::InvalidMarketId
    )]
    pub market_positions_account: Box<Account<'info, PositionAccount>>,

    #[account(
        mut, 
        constraint = usdc_mint.key() == Pubkey::from_str(USDC_MINT).unwrap() @ ShortxError::InvalidMint
    )]
    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = usdc_mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program
    )]
    pub user_usdc_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub market_usdc_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: We verify ownership through token account
    #[account(mut)]
    pub nft_mint: AccountInfo<'info>,

    /// CHECK: Burn expects type of accountInfo so I guess checking happens in the CPI
    #[account(mut)]
    pub user_nft_token_account: AccountInfo<'info>,

    /// CHECK: Burn expects type of accountInfo so I guess checking happens in the CPI
    #[account(mut)]
    pub nft_collection_metadata: AccountInfo<'info>,

    /// CHECK: Verified by CPI
    #[account(mut)]
    pub nft_metadata_account: AccountInfo<'info>,

    /// CHECK: Check by CPI
    #[account(mut)]
    pub nft_master_edition_account: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,

    /// CHECK: Check by CPI
    pub token_metadata_program: AccountInfo<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


impl<'info> PositionContext<'info> {
    pub fn open_position(&mut self, args: OpenPositionArgs) -> Result<()> {
        let market = &mut self.market;
        let market_positions_account = &mut self.market_positions_account;
    
        let ts = Clock::get()?.unix_timestamp;
    

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
        for (i, pos) in market_positions_account.positions.iter().enumerate() {
            msg!("Position {}: status = {:?}", i, pos.position_status);
        }
    
        let position_index = market_positions_account.positions
            .iter()
            .position(
                |position|
                    position.position_status == PositionStatus::Init
            )
            .ok_or(ShortxError::NoAvailablePositionSlot)?;
    
            
        msg!("Position Index {:?}", position_index);

        let position_nonce = market_positions_account.get_position_nonce();
        msg!("Position Nonce {:?}", position_nonce);
        market_positions_account.positions[position_index] = Position {
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
            position_nonce: position_nonce,
            padding: [0; 3],
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

        transfer_checked(
            CpiContext::new(self.token_program.to_account_info(), TransferChecked {
                from: self.user_usdc_ata.to_account_info(),
                mint: self.usdc_mint.to_account_info(),
                to: self.market_usdc_vault.to_account_info(),
                authority: self.signer.to_account_info(),
            }),
            net_amount,
            self.usdc_mint.decimals
        )?;
    
        let current_position = market_positions_account.positions[position_index];
    
        market_positions_account.emit_position_event(current_position)?;
    
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


    pub fn payout_position(&mut self, position_id: u64) -> Result<()> {
        let market = &mut self.market;
        let market_positions_account = &mut self.market_positions_account;
        let ts = Clock::get()?.unix_timestamp;
    
        require!(
            market.winning_direction != WinningDirection::None,
            ShortxError::MarketStillActive
        );
        require!(market.market_state == MarketStates::Resolved, ShortxError::MarketNotAllowedToPayout);

    
        let position_index = market_positions_account.positions
            .iter()
            .position(|position| {
                position.position_id == position_id &&
                    position.position_status == PositionStatus::Open &&
                    position.market_id == market.market_id
            })
            .ok_or(ShortxError::PositionNotFound)?;
    
        let position = market_positions_account.positions[position_index];
    
        let is_winner = match (position.direction, market.winning_direction) {
            | (PositionDirection::Yes, WinningDirection::Yes)
            | (PositionDirection::No, WinningDirection::No) => true,
            _ => false,
        };
    
        let mut payout = 0;
    
        if is_winner {

            let (winning_liquidity, otherside_liquidity) = match position.direction {
                PositionDirection::Yes => (market.yes_liquidity, market.no_liquidity),
                PositionDirection::No => (market.no_liquidity, market.yes_liquidity),
            };
            

            // Convert u64s to Decimals
            let position_amount = Decimal::from(position.amount);
            let winning_liquidity = Decimal::from(winning_liquidity);
            let otherside_liquidity = Decimal::from(otherside_liquidity);

            // Compute percentage share of the winning pool
            let winning_percentage = position_amount
                .checked_div(winning_liquidity)
                .ok_or(ShortxError::ArithmeticOverflow)?;

            // Compute share from otherside pool
            let share_of_otherside = otherside_liquidity
                .checked_mul(winning_percentage)
                .ok_or(ShortxError::ArithmeticOverflow)?;

            // Total payout = stake + winnings
            let total_payout = share_of_otherside
                .checked_add(position_amount)
                .ok_or(ShortxError::ArithmeticOverflow)?;

            // Convert back to u64 (this floors the value)
            payout = total_payout.try_into().map_err(|_| ShortxError::ArithmeticOverflow)?;
        }
    
        
        if payout > 0 && is_winner {
            let market_signer: &[&[&[u8]]] = &[&[b"market", &market.market_id.to_le_bytes(), &[market.bump]]];
    
            
                transfer_checked(
                    CpiContext::new_with_signer(
                        self.token_program.to_account_info(),
                        TransferChecked {
                            from: self.market_usdc_vault.to_account_info(),
                            mint: self.usdc_mint.to_account_info(),
                            to: self.user_usdc_ata.to_account_info(),
                            authority: market.to_account_info(),
                        },
                        market_signer
                    ),
                    payout,
                    self.usdc_mint.decimals
                )?;
                
            msg!("Market Liquidity {:?}", self.market_usdc_vault.amount);
            msg!("Order Price {:?}", position.amount);
            msg!("Payout {:?}", payout);
        }
    
        market_positions_account.positions[position_index].position_status = PositionStatus::Closed;
        market_positions_account.positions[position_index].ts = ts;
    
        market_positions_account.emit_position_event(market_positions_account.positions[position_index])?;
    
        require!(ts > market.update_ts, ShortxError::ConcurrentTransaction);
    
        market.update_ts = ts;
    
        market.emit_market_event()?;
    
        Ok(())
    }
}


impl<'info> PayoutNftContext<'info> {
    pub fn payout_nft_position(&mut self, args: PayoutNftArgs) -> Result<()> {
        let market = &mut self.market;
        let market_positions_account = &mut self.market_positions_account;
        let ts = Clock::get()?.unix_timestamp;

        msg!("Starting NFT payout for position {}", args.position_id);
        msg!("Market ID: {}", market.market_id);
        msg!("Market bump: {}", market.bump);
        msg!("Market authority: {}", market.authority);
        msg!("Market vault: {}", self.market_usdc_vault.key());
        msg!("Market vault owner: {}", self.market_usdc_vault.owner);

        // Check market is resolved
        require!(
            market.winning_direction != WinningDirection::None,
            ShortxError::MarketStillActive
        );
        require!(market.market_state == MarketStates::Resolved, ShortxError::MarketNotAllowedToPayout);

        // Verify market ID matches
        require!(args.market_id == market.market_id, ShortxError::InvalidMarketId);

        // Find position with this position ID
        let position_index = market_positions_account.positions
            .iter()
            .position(|pos| {
                pos.position_id == args.position_id &&
                pos.mint == Some(self.nft_mint.key()) && //check that the nft mint is the same as the one in the position
                pos.is_nft &&
                pos.position_status == PositionStatus::Open &&
                pos.amount == args.amount
            })
            .ok_or(ShortxError::PositionNotFound)?;

        let position = market_positions_account.positions[position_index];
        msg!("Found position at index {}", position_index);
        msg!("Position direction: {:?}", position.direction);
        msg!("Market winning direction: {:?}", market.winning_direction);

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
            

            // Convert u64s to Decimals
            let position_amount = Decimal::from(position.amount);
            let winning_liquidity = Decimal::from(winning_liquidity);
            let otherside_liquidity = Decimal::from(otherside_liquidity);

            // Compute percentage share of the winning pool
            let winning_percentage = position_amount
                .checked_div(winning_liquidity)
                .ok_or(ShortxError::ArithmeticOverflow)?;

            // Compute share from otherside pool
            let share_of_otherside = otherside_liquidity
                .checked_mul(winning_percentage)
                .ok_or(ShortxError::ArithmeticOverflow)?;

            // Total payout = stake + winnings
            let total_payout = share_of_otherside
                .checked_add(position_amount)
                .ok_or(ShortxError::ArithmeticOverflow)?;

            // Convert back to u64 (this floors the value)
            payout = total_payout.try_into().map_err(|_| ShortxError::ArithmeticOverflow)?;
        }

        if payout > 0 && is_winner {
            // Transfer payout
            let market_signer: &[&[&[u8]]] = &[&[b"market", &market.market_id.to_le_bytes(), &[market.bump]]];
            msg!("Using signer seeds: {:?}", market_signer);
            msg!("Market vault amount before transfer: {}", self.market_usdc_vault.amount);
            msg!("User ATA amount before transfer: {}", self.user_usdc_ata.amount);

            transfer_checked(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: self.market_usdc_vault.to_account_info(),
                        mint: self.usdc_mint.to_account_info(),
                        to: self.user_usdc_ata.to_account_info(),
                        authority: market.to_account_info(),
                    },
                    market_signer
                ),
                payout,
                self.usdc_mint.decimals
            )?;

            // Burn the NFT
            msg!("Starting NFT burn");
            msg!("NFT token account: {}", self.user_nft_token_account.key());
            msg!("NFT token account owner: {}", self.user_nft_token_account.owner);
            msg!("NFT mint: {}", self.nft_mint.key());
            msg!("Master edition: {}", self.nft_master_edition_account.key());
            msg!("Metadata account: {}", self.nft_metadata_account.key());


            let owner = self.signer.to_account_info();
            let metadata = self.nft_metadata_account.to_account_info();
            let mint = self.nft_mint.to_account_info();
            let token = self.user_nft_token_account.to_account_info();
            let edition = self.nft_master_edition_account.to_account_info();
            let spl_token = self.token_program.to_account_info();
            let metadata_program_id = self.token_metadata_program.to_account_info();
            let collection_metadata = self.nft_collection_metadata.to_account_info();
    
            BurnNftCpiBuilder::new(&metadata_program_id)
            .metadata(&metadata)
            // if your NFT is part of a collection you will need to pass in the collection metadata address.
            .collection_metadata(Some(collection_metadata.as_ref()))
            .owner(&owner)
            .mint(&mint)
            .token_account(&token)
            .master_edition_account(&edition)
            .spl_token_program(&spl_token)
            .invoke()?;

            msg!("NFT burn successful");
        }

        // Update position status
        market_positions_account.positions[position_index].position_status = PositionStatus::Closed;
        market_positions_account.positions[position_index].ts = ts;
        market_positions_account.emit_position_event(market_positions_account.positions[position_index])?;

        require!(ts > market.update_ts, ShortxError::ConcurrentTransaction);
        market.update_ts = ts;
        market.emit_market_event()?;

        msg!("Payout completed successfully");
        Ok(())
    }
}

