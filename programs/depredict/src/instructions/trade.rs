use anchor_lang::prelude::*;
use anchor_lang::system_program::{ transfer, Transfer };
use anchor_spl::token::{Token, TransferChecked, transfer_checked};

use anchor_spl::{ associated_token::AssociatedToken, token_interface::{ Mint, TokenAccount } };
use std::str::FromStr;
use switchboard_on_demand::prelude::rust_decimal::Decimal;
use crate::constants::{MARKET, POSITION_PAGE, MPL_NOOP_ID, MPL_ACCOUNT_COMPRESSION_ID};
use crate::state::{Config, MarketStates, MarketType, OpenPositionArgs, ConfirmPositionArgs, ClaimPositionArgs, PositionDirection, PositionStatus, PositionPage, POSITION_PAGE_ENTRIES};
use crate::{
    errors::DepredictError,
    state::{ MarketState, WinningDirection },
};
use mpl_bubblegum::ID as BUBBLEGUM_ID;
use mpl_bubblegum::instructions::MintV2CpiBuilder;
use mpl_bubblegum::types::MetadataArgsV2;
use mpl_core::ID as MPL_CORE_ID;

#[derive(Accounts)]
#[instruction(args: OpenPositionArgs)]
pub struct PositionContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: multisig fee vault account
    #[account(
        mut, 
        constraint = fee_vault.key() == config.fee_vault @ DepredictError::InvalidFeeVault
    )]
    pub fee_vault: AccountInfo<'info>,

    // Paged positions account for this market and page index
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + PositionPage::INIT_SPACE,
        seeds = [POSITION_PAGE.as_bytes(), &market.market_id.to_le_bytes(), &args.page_index.to_le_bytes()],
        bump
    )]
    pub position_page: Box<Account<'info, PositionPage>>,


    #[account(mut,
        seeds = [MARKET.as_bytes(), &market.market_id.to_le_bytes()],
        bump
    )]
    pub market: Box<Account<'info, MarketState>>,

    #[account(
        mut, 
        constraint = mint.key() == market.mint.unwrap() @ DepredictError::InvalidMint
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program
    )]
    pub user_mint_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    pub config: Box<Account<'info, Config>>,

    /// CHECK: global merkle tree account; must match config.global_tree
    #[account(mut, constraint = merkle_tree.key() == config.global_tree @ DepredictError::InvalidOracle)]
    pub merkle_tree: AccountInfo<'info>,

    /// CHECK: TreeConfig PDA for the merkle tree
    #[account(mut)]
    pub tree_config: AccountInfo<'info>,

    /// CHECK: Core collection asset account; must match config.global_collection
    #[account(mut, constraint = collection.key() == config.global_collection @ DepredictError::InvalidCollection)]
    pub collection: AccountInfo<'info>,

    /// CHECK: Bubblegum program
    #[account(address = BUBBLEGUM_ID)]
    pub bubblegum_program: AccountInfo<'info>,

    /// CHECK: MPL Core program
    #[account(address = MPL_CORE_ID)]
    pub mpl_core_program: AccountInfo<'info>,

    /// CHECK: Log wrapper (mpl-noop)
    #[account(address = Pubkey::from_str(MPL_NOOP_ID).unwrap())]
    pub log_wrapper_program: AccountInfo<'info>,

    /// CHECK: Account compression program (mpl-account-compression)
    #[account(address = Pubkey::from_str(MPL_ACCOUNT_COMPRESSION_ID).unwrap())]
    pub compression_program: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: ClaimPositionArgs)]
pub struct PayoutNftContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub market: Box<Account<'info, MarketState>>,

    pub config: Box<Account<'info, Config>>,

    #[account(
        mut,
        seeds = [POSITION_PAGE.as_bytes(), &market.market_id.to_le_bytes(), &args.page_index.to_le_bytes()],
        bump
    )]
    pub position_page: Box<Account<'info, PositionPage>>,

    #[account(
        mut, 
        constraint = mint.key() == market.mint.unwrap() @ DepredictError::InvalidMint
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program
    )]
    pub user_mint_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: cNFT verification accounts will be added when Bubblegum CPI is integrated
    #[account(mut)]
    pub merkle_tree: AccountInfo<'info>,

    /// CHECK: Core program
    #[account(address = MPL_CORE_ID)]
    pub mpl_core_program: AccountInfo<'info>,


    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: ConfirmPositionArgs)]
pub struct ConfirmPositionContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut,
        seeds = [MARKET.as_bytes(), &market.market_id.to_le_bytes()],
        bump
    )]
    pub market: Box<Account<'info, MarketState>>,

    #[account(mut,
        seeds = [POSITION_PAGE.as_bytes(), &market.market_id.to_le_bytes(), &args.page_index.to_le_bytes()],
        bump
    )]
    pub position_page: Box<Account<'info, PositionPage>>,
}



impl<'info> PositionContext<'info> {
    pub fn open_position(&mut self, args: OpenPositionArgs) -> Result<()> {
        let next_position_id = self.market.next_position_id; // Store before increment
        let market = &mut self.market;
        let market_type = market.market_type;
        let position_page = &mut self.position_page;
        let ts = Clock::get()?.unix_timestamp;
    
        // Collection is provided as an account and constrained to match config.global_collection in the accounts struct

        if market_type == MarketType::Future {
            require!(ts < market.market_start && ts > market.betting_start, DepredictError::BettingPeriodExceeded);
        } 

        require!(market.market_end > ts, DepredictError::BettingPeriodEnded);
        require!(
            market.winning_direction == WinningDirection::None,
            DepredictError::MarketAlreadyResolved
        );
    
        // this ensures multiple orders are not created at the same time
        require!(ts > market.update_ts, DepredictError::ConcurrentTransaction);
    
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
        
        // Determine free slot within page
        let position_index = (position_page.count as usize).min(POSITION_PAGE_ENTRIES - 1);
    
            
        msg!("Position Index {:?}", position_index);

        // Update compact entry; leaf_index will be set during confirmation
        position_page.entries[position_index].amount = net_amount;
        position_page.entries[position_index].direction = args.direction;
        position_page.entries[position_index].status = PositionStatus::Open;
        position_page.count = position_page.count.saturating_add(1);
    
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
                from: self.user_mint_ata.to_account_info(),
                mint: self.mint.to_account_info(),
                to: self.market_vault.to_account_info(),
                authority: self.signer.to_account_info(),
            }),
            net_amount,
            self.mint.decimals
        )?;
    
        // Emit minimal event via existing structure if needed (optional)
    
        let fee = self.config.fee_amount;
    
        let transfer_result = transfer(
            CpiContext::new(self.system_program.to_account_info(), Transfer {
                from: self.signer.to_account_info(),
                to: self.fee_vault.to_account_info(),
            }),
            fee
        );
    
        if let Err(_) = transfer_result {
            return Err(DepredictError::InsufficientFunds.into());
        }
    
        require!(ts > market.update_ts, DepredictError::ConcurrentTransaction);
    
        market.update_ts = ts;
    
        market.emit_market_event()?;

        let do_bubblegum = self.merkle_tree.lamports() > 0;
        if do_bubblegum {
            // Build uri = {base_uri}/{marketId}/{positionId}.json from fixed bytes
            let base_uri = std::str::from_utf8(&self.config.base_uri).unwrap_or("").trim_matches(char::from(0));
            let uri = format!("{}/{}/{}.json", base_uri, market.market_id, next_position_id);
            let name = format!("DEPREDICT-{}-{}", market.market_id, next_position_id);

            // Build MetadataArgsV2 with required fields for mpl-bubblegum 2.1.1
            let metadata = MetadataArgsV2 {
                name,
                symbol: String::from(""),
                uri,
                seller_fee_basis_points: 0,
                primary_sale_happened: false,
                is_mutable: false,
                // For Core collections, Bubblegum expects token_standard to be None
                token_standard: None,
                collection: None,
                creators: vec![],
            };

            let mut builder = MintV2CpiBuilder::new(&self.bubblegum_program);
            // Bind AccountInfo temporaries to extend lifetimes for the builder
            let payer_ai = self.signer.to_account_info();
            let leaf_owner_ai = self.signer.to_account_info();
            let system_ai = self.system_program.to_account_info();
            builder
                .tree_config(&self.tree_config)
                .payer(&payer_ai)
                .tree_creator_or_delegate(None)
                .collection_authority(None)
                .leaf_owner(&leaf_owner_ai)
                .leaf_delegate(None)
                .merkle_tree(&self.merkle_tree)
                .core_collection(if self.collection.lamports() > 0 { Some(&self.collection) } else { None })
                .mpl_core_cpi_signer(None)
                .log_wrapper(&self.log_wrapper_program)
                .compression_program(&self.compression_program)
                .mpl_core_program(&self.mpl_core_program)
                .system_program(&system_ai)
                .metadata(metadata);
            builder.invoke()?;
        } else {
            return Err(DepredictError::InvalidNft.into());
        }
        msg!("Position created; awaiting confirmation by market authority.");
        Ok(())
    }
}


impl<'info> PayoutNftContext<'info> {
    pub fn payout_position(&mut self, args: ClaimPositionArgs) -> Result<()> {

        let market = &mut self.market;
        let position_page = &mut self.position_page;
        let ts = Clock::get()?.unix_timestamp;
        let _payer = &self.signer.to_account_info();
        let _system_program = &self.system_program.to_account_info();
        let _mpl_core_program = &self.mpl_core_program.to_account_info();

        msg!("Market ID: {}", market.market_id);
        msg!("Market bump: {}", market.bump);
        msg!("Market authority: {}", market.authority);
        msg!("Market vault: {}", self.market_vault.key());
        msg!("Market vault owner: {}", self.market_vault.owner);

        // Check market is resolved
        require!(
            market.winning_direction != WinningDirection::None,
            DepredictError::MarketStillActive
        );
        require!(market.market_state == MarketStates::Resolved, DepredictError::MarketNotAllowedToPayout);

        // Verify position entry is confirmed
        let slot_index: usize = args.slot_index as usize;
        require!(slot_index < POSITION_PAGE_ENTRIES, DepredictError::PositionNotFound);
        let entry = position_page.entries[slot_index];
        // Must be Open (and confirmed by having a non-zero leaf_index)
        require!(entry.status == PositionStatus::Open, DepredictError::PositionNotFound);
        require!(entry.leaf_index == args.leaf_index && entry.leaf_index != 0, DepredictError::InvalidNft);
        // Merkle tree provided must match config
        require!(self.merkle_tree.key() == self.config.global_tree, DepredictError::InvalidOracle);
        // TODO: Verify Merkle inclusion of leaf using args.leaf_index and provided proof accounts
        let position_amount = entry.amount;
        let position_direction = entry.direction;

        // Check if position won
        let is_winner = match (position_direction, market.winning_direction) {
            (PositionDirection::Yes, WinningDirection::Yes) |
            (PositionDirection::No, WinningDirection::No) => true,
            _ => false,
        };


        let mut payout = 0;
        if is_winner {

            let (winning_liquidity, otherside_liquidity) = match position_direction {
                PositionDirection::Yes => (market.yes_liquidity, market.no_liquidity),
                PositionDirection::No => (market.no_liquidity, market.yes_liquidity),
            };
            

            // Convert u64s to Decimals
            let position_amount = Decimal::from(position_amount);
            let winning_liquidity = Decimal::from(winning_liquidity);
            let otherside_liquidity = Decimal::from(otherside_liquidity);

            // Compute percentage share of the winning pool
            let winning_percentage = position_amount
                .checked_div(winning_liquidity)
                .ok_or(DepredictError::ArithmeticOverflow)?;

            // Compute share from otherside pool
            let share_of_otherside = otherside_liquidity
                .checked_mul(winning_percentage)
                .ok_or(DepredictError::ArithmeticOverflow)?;

            // Total payout = stake + winnings
            let total_payout = share_of_otherside
                .checked_add(position_amount)
                .ok_or(DepredictError::ArithmeticOverflow)?;

            // Convert back to u64 (this floors the value)
            payout = total_payout.try_into().map_err(|_| DepredictError::ArithmeticOverflow)?;
        }

        if payout > 0 && is_winner {
            // Transfer payout
            let market_signer: &[&[&[u8]]] = &[&[MARKET.as_bytes(), &market.market_id.to_le_bytes(), &[market.bump]]];
            msg!("Using signer seeds: {:?}", market_signer);
            msg!("Market vault amount before transfer: {}", self.market_vault.amount);
            msg!("User ATA amount before transfer: {}", self.user_mint_ata.amount);

            transfer_checked(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: self.market_vault.to_account_info(),
                        mint: self.mint.to_account_info(),
                        to: self.user_mint_ata.to_account_info(),
                        authority: market.to_account_info(),
                    },
                    market_signer
                ),
                payout,
                self.mint.decimals
            )?;
        }

        // Update position status
        position_page.entries[slot_index].status = PositionStatus::Closed;

        require!(ts > market.update_ts, DepredictError::ConcurrentTransaction);
        market.update_ts = ts;
        market.emit_market_event()?;

        msg!("Payout completed successfully");
        Ok(())
    }
}

