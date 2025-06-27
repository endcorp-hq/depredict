use anchor_lang::prelude::*;
use anchor_lang::system_program::{ transfer, Transfer };
use anchor_spl::token::{Token, TransferChecked, transfer_checked};

use anchor_spl::{ associated_token::AssociatedToken, token_interface::{ Mint, TokenAccount } };

use mpl_core::fetch_plugin;
use mpl_core::instructions::BurnV1CpiBuilder;
use switchboard_on_demand::prelude::rust_decimal::Decimal;

use std::str::FromStr;

use crate::constants::{MARKET, USDC_MINT};
use crate::state::{Config, MarketStates, OpenPositionArgs, Position, PositionAccount, PositionDirection, PositionStatus};
use crate::{
    errors::ShortxError,
    state::{ MarketState, WinningDirection },
};
use mpl_core::{
    accounts::{
        BaseAssetV1
    },
    ID as MPL_CORE_ID,
    instructions::{
        CreateV2CpiBuilder
    },
    types::{
        Attribute, 
        Attributes, 
        Plugin, 
        PluginAuthorityPair,
    },
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

    /// CHECK: This account will be created by the CPI to mpl_core
    #[account(
        mut,
        seeds = [ 
            b"nft", 
            market_positions_account.market_id.to_le_bytes().as_ref(), 
            market.next_position_id.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub position_nft_account: AccountInfo<'info>,


    #[account(mut,
        seeds = [MARKET.as_bytes(), &market_positions_account.market_id.to_le_bytes()],
        bump
    )]
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
    
    /// CHECK: this account is checked by the address constraint and in MPL core.
    #[account(
        mut,
        constraint = collection.key() == market.nft_collection.unwrap() @ ShortxError::InvalidCollection
    )]
    pub collection: AccountInfo<'info>,

    /// CHECK: this account is checked by the address constraint and in MPL core.
    #[account(address = MPL_CORE_ID)]
    pub mpl_core_program: AccountInfo<'info>,

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
        constraint = market_positions_account.market_id == market.market_id @ ShortxError::InvalidMarketId)]
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

    // TODO: Check nft_mint address against the position.mint address.
    /// CHECK: this account is checked by the address constraint
    #[account(mut)]
    pub nft_mint: AccountInfo<'info>,

    /// CHECK: this account is checked by the address constraint
    #[account(
        mut,
        constraint = collection.key() == market.nft_collection.unwrap() @ ShortxError::InvalidCollection
    )]
    pub collection: AccountInfo<'info>,

    /// CHECK: this account is checked by the address constraint and in MPL core.
     #[account(
        address = MPL_CORE_ID,
        constraint = mpl_core_program.key() == MPL_CORE_ID @ ShortxError::InvalidMplCoreProgram
    )]
     pub mpl_core_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


impl<'info> PositionContext<'info> {
    pub fn open_position(&mut self, args: OpenPositionArgs, bumps: &PositionContextBumps) -> Result<()> {
        let next_position_id = self.market.next_position_id; // Store before increment
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
            mint: Some(self.position_nft_account.key()),
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

        msg!("Position created");

        msg!("Creating NFT");


        // Add attributes to the NFT
        msg!("Adding attributes to NFT");
        let attributes = Attributes {
            attribute_list: vec![
                Attribute {
                    key: "market_id".to_string(),
                    value: market_positions_account.market_id.to_string(),
                },
                // Attribute {
                //     key: "market_question".to_string(),
                //     value: String::from_utf8_lossy(&market.question).trim_end_matches('\0').to_string(),
                // },
                Attribute {
                    key: "position_id".to_string(),
                    value: current_position.position_id.to_string(),
                },
                Attribute {
                    key: "position_nonce".to_string(),
                    value: current_position.position_nonce.to_string(),
                },
                Attribute {
                    key: "position_amount".to_string(),
                    value: current_position.amount.to_string(),
                },
                Attribute {
                    key: "bet_direction".to_string(),
                    value: current_position.direction.to_string(),
                },
            ],
        };
       
        
        let position_nft_account_bump = bumps.position_nft_account;
        let market_id = &market_positions_account.market_id.to_le_bytes();

        let nft_signer_seeds: &[&[u8]] = &[
            b"nft",
            market_id,
            &next_position_id.to_le_bytes(),
            &[position_nft_account_bump],
        ];

        let market_signer_seeds: &[&[u8]] = &[
            b"market",
            &self.market.market_id.to_le_bytes(),
            &[bumps.market],
        ];

        msg!("NFT Signer Seeds: {:?}", nft_signer_seeds);
        msg!("market_id: {:?}", market_id);
        msg!("position_id: {:?}", &next_position_id.to_le_bytes());
        msg!("position_nft_account_bump: {:?}", position_nft_account_bump);


        let nft_name = format!("SHORTX MARKET:{}, POS:{}", market_positions_account.market_id, current_position.position_id);
        let uri = format!("https://shortx.io/market/{}/{}/{} ", market_positions_account.market_id, current_position.position_id, current_position.position_nonce);
        let mpl_core_program = &self.mpl_core_program.to_account_info();
        
        msg!("Collection: {:?}", self.collection.key());
        
        msg!("Create the asset");
        let mut create_asset_cpi = CreateV2CpiBuilder::new(mpl_core_program);
        create_asset_cpi    
        .asset(&self.position_nft_account.to_account_info())
        .name(nft_name)
        .uri(uri)
        .collection(Some(&self.collection.to_account_info()))
        .authority(Some(&self.market.to_account_info()))
        .owner(Some(&self.signer.to_account_info()))
        .payer(&self.signer.to_account_info())
        .plugins(vec![PluginAuthorityPair {
            plugin: Plugin::Attributes(attributes),
            authority: None,
        }])
        .system_program(&self.system_program.to_account_info())
        .invoke_signed(&[nft_signer_seeds, market_signer_seeds])?;

        msg!("NFT created");
        Ok(())
    }
}


impl<'info> PayoutNftContext<'info> {
    pub fn payout_position(&mut self) -> Result<()> {
        let market = &mut self.market;
        let market_positions_account = &mut self.market_positions_account;
        let ts = Clock::get()?.unix_timestamp;

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

        // check the signer of the tx owns the nft
        let asset = self.nft_mint.to_account_info();
        let data = asset.try_borrow_data()?;
        let base_asset: BaseAssetV1 = BaseAssetV1::from_bytes(&data.as_ref())?;

        msg!("Base asset: {:?}", base_asset.owner);

        require!(&base_asset.owner == &self.signer.key(), ShortxError::Unauthorized);

        let (_, attribute_list, _) = fetch_plugin::<BaseAssetV1, Attributes>(&self.nft_mint.to_account_info(), mpl_core::types::PluginType::Attributes)?;

        msg!("Attribute list of nft: {:?}", attribute_list);

        // Verify market ID matches
        require!(attribute_list.attribute_list[0].value.parse::<u64>().unwrap() == market.market_id, ShortxError::InvalidMarketId);

        // Find position with this position ID
        let position_index = market_positions_account.positions
            .iter()
            .position(|pos| {
                pos.position_id == attribute_list.attribute_list[1].value.parse::<u64>().unwrap() &&
                pos.position_status == PositionStatus::Open &&
                pos.amount == attribute_list.attribute_list[3].value.parse::<u64>().unwrap()
            })
            .ok_or(ShortxError::PositionNotFound)?;

        // position mint_nft field must match nft_mint address
        require!(market_positions_account.positions[position_index].mint.unwrap() == self.nft_mint.key(), ShortxError::InvalidNft);

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


            let asset = self.nft_mint.to_account_info();
            let collection = self.collection.to_account_info();
            let payer = self.signer.to_account_info();
            let system_program = self.system_program.to_account_info();

            // let nft_signer_seeds: &[&[u8]] = &[
            //     b"nft",
            //     &market.market_id.to_le_bytes(),
            //     &market_positions_account.positions[position_index].position_id.to_le_bytes(),
            //     &[self.nft_mint.bump],
            // ];


            let market_signer_seeds: &[&[u8]] = &[
                b"market",
                &market.market_id.to_le_bytes(),
                &[market.bump],
            ];

        
            msg!("Burning NFT");
            BurnV1CpiBuilder::new(&self.mpl_core_program.to_account_info())
            .asset(&asset)
            .collection(Some(&collection))
            .payer(&payer)
            .authority(Some(&payer))
            .system_program(Some(&system_program))
            .invoke_signed(&[ market_signer_seeds])?;

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

