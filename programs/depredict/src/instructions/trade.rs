use anchor_lang::prelude::*;
use anchor_lang::system_program::{ transfer, Transfer };
use anchor_spl::token::{Token, TransferChecked, transfer_checked};

use anchor_spl::{ associated_token::AssociatedToken, token_interface::{ Mint, TokenAccount } };

use switchboard_on_demand::prelude::rust_decimal::Decimal;
use crate::constants::{MARKET, POSITION_PAGE};
use crate::state::{Config, MarketStates, MarketType, OpenPositionArgs, PositionDirection, PositionStatus, PositionPage, POSITION_PAGE_ENTRIES};
use crate::{
    errors::DepredictError,
    state::{ MarketState, WinningDirection },
};

#[derive(Accounts)]
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
        seeds = [POSITION_PAGE.as_bytes(), &market.market_id.to_le_bytes(), &page_index.to_le_bytes()],
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
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


impl<'info> PositionContext<'info> {
    pub fn open_position(&mut self, args: OpenPositionArgs, bumps: &PositionContextBumps) -> Result<()> {
        let next_position_id = self.market.next_position_id; // Store before increment
        let market = &mut self.market;
        let market_type = market.market_type;
        let position_page = &mut self.position_page;
        let ts = Clock::get()?.unix_timestamp;
    

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

        // Update compact entry; leaf_index will be set after mint when integrated
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

        msg!("Position created (cNFT mint via Bubblegum to be integrated)");
        Ok(())
    }
}


impl<'info> PayoutNftContext<'info> {
    pub fn payout_position(&mut self) -> Result<()> {

        let market = &mut self.market;
        let market_positions_account = &mut self.market_positions_account;
        let ts = Clock::get()?.unix_timestamp;
        let payer = &self.signer.to_account_info();
        let system_program = &self.system_program.to_account_info();
        let mpl_core_program = &self.mpl_core_program.to_account_info();

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

        // check the signer of the tx owns the nft
        let data = self.nft_mint.try_borrow_data()?;
        let base_asset: BaseAssetV1 = BaseAssetV1::from_bytes(data.as_ref())?;

        msg!("Base asset: {:?}", base_asset.owner);

        require!(&base_asset.owner == &self.signer.key(), DepredictError::Unauthorized);

        // Drop the borrow before fetching plugin data
        drop(data);

        let (_, attribute_list, _) = fetch_plugin::<BaseAssetV1, Attributes>(&self.nft_mint.to_account_info(), mpl_core::types::PluginType::Attributes)?;

        msg!("Attribute list of nft: {:?}", attribute_list);

        // Verify market ID matches
        require!(attribute_list.attribute_list[0].value.parse::<u64>().unwrap() == market.market_id, DepredictError::InvalidMarketId);

        // Find position with this position ID
        let position_index = market_positions_account.positions
            .iter()
            .position(|pos| {
                pos.position_id == attribute_list.attribute_list[1].value.parse::<u64>().unwrap() &&
                pos.position_status == PositionStatus::Open &&
                pos.amount == attribute_list.attribute_list[3].value.parse::<u64>().unwrap()
            })
            .ok_or(DepredictError::PositionNotFound)?;

        // position mint_nft field must match nft_mint address
        require!(market_positions_account.positions[position_index].mint.unwrap() == self.nft_mint.key(), DepredictError::InvalidNft);

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

            let market_signer_seeds: &[&[u8]] = &[
                MARKET.as_bytes(),
                &market.market_id.to_le_bytes(),
                &[market.bump],
            ];

            msg!("Burning NFT");
            let mut burn_asset_cpi = BurnV1CpiBuilder::new(mpl_core_program);

            burn_asset_cpi
            .asset(&self.nft_mint.to_account_info())
            .collection(Some(&self.collection.to_account_info()))
            .payer(payer)
            .authority(Some(payer))
            .system_program(Some(system_program))
            .invoke_signed(&[market_signer_seeds])?;

            msg!("NFT burn successful");
        }

        // Update position status
        market_positions_account.positions[position_index].position_status = PositionStatus::Closed;
        market_positions_account.positions[position_index].ts = ts;
        market_positions_account.emit_position_event(market_positions_account.positions[position_index])?;

        require!(ts > market.update_ts, DepredictError::ConcurrentTransaction);
        market.update_ts = ts;
        market.emit_market_event()?;

        msg!("Payout completed successfully");
        Ok(())
    }
}

