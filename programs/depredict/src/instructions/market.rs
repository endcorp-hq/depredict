use std::str::FromStr;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{
        Token, 
        TransferChecked,
        transfer_checked,
        CloseAccount,
        close_account
    },
    token_interface::{ 
        Mint, 
        TokenAccount, 
        TokenInterface
    }
};
use mpl_core::{
    ID as MPL_CORE_ID,
    instructions::CreateCollectionV2CpiBuilder, 
    types::{
        Plugin,
        Attributes,
        Attribute,
        PluginAuthorityPair,
        PluginAuthority
    }
};

use switchboard_on_demand::{prelude::rust_decimal::Decimal};
use crate::{constants::{ 
    MARKET, NFT_COLLECTION, POSITION, USDC_MINT
    }, 
    constraints::{
        get_oracle_value, 
        is_valid_oracle
    }, 
    state::{
        CloseMarketArgs, Config, CreateMarketArgs, MarketState, MarketStates, MarketType, OracleType, Position, PositionAccount, PositionStatus, ResolveMarketArgs, UpdateMarketArgs, WinningDirection
    }
};
use crate::errors::DepredictError;

#[derive(Accounts)]
#[instruction(args: CreateMarketArgs)]
pub struct MarketContext<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: fee vault account
    #[account(
        mut, 
        constraint = fee_vault.key() == config.fee_vault @ DepredictError::InvalidFeeVault
    )]
    pub fee_vault: AccountInfo<'info>,

    /// CHECK: oracle is checked in the implementation function
    #[account(mut)]
    pub oracle_pubkey: AccountInfo<'info>,
    
    #[account(mut)]
    pub config: Box<Account<'info, Config>>,

    #[account(
        init,
        payer = payer,
        space = 8 + MarketState::INIT_SPACE,
        seeds = [MARKET.as_bytes(), &config.next_market_id.to_le_bytes()],
        bump
    )]
    pub market: Box<Account<'info, MarketState>>,

    #[account(
        init,
        payer = payer,
        space = 8 + PositionAccount::INIT_SPACE,
        seeds = [POSITION.as_bytes(), &config.next_market_id.to_le_bytes()],
        bump
    )]
    pub market_positions_account: Box<Account<'info, PositionAccount>>,
    
    /// CHECK: This account will be created by the CPI to mpl_core
    #[account(
        mut,
        seeds = [ 
            NFT_COLLECTION.as_bytes(), 
            &config.next_market_id.to_le_bytes()
        ],
        bump
    )]
    pub collection: UncheckedAccount<'info>,

    #[account(
        mut, 
        constraint = usdc_mint.key() == Pubkey::from_str(USDC_MINT).unwrap() @ DepredictError::InvalidMint
    )]
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = usdc_mint,
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub market_usdc_vault: Box<InterfaceAccount<'info, TokenAccount>>,

     /// CHECK: this account is checked by the address constraint and in MPL core.
     #[account(
        address = MPL_CORE_ID,
        constraint = mpl_core_program.key() == MPL_CORE_ID @ DepredictError::InvalidMplCoreProgram
    )]
     pub mpl_core_program: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// Create a separate context for the update_market instruction
#[derive(Accounts)]
pub struct UpdateMarketContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        constraint = market.authority == signer.key() @ DepredictError::Unauthorized
    )] // Market must exist already, signer must be the market authority
    pub market: Box<Account<'info, MarketState>>,
    pub system_program: Program<'info, System>,
}

// Context for resolving the market
#[derive(Accounts)]
pub struct ResolveMarketContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        constraint = market.authority == signer.key() @ DepredictError::Unauthorized
    )]
    pub market: Box<Account<'info, MarketState>>,

    /// CHECK: oracle is same as the market's oracle pubkey
    #[account(
        mut
    )]
    pub oracle_pubkey: AccountInfo<'info>,
}

// Context for closing the market
#[derive(Accounts)]
#[instruction(args: CloseMarketArgs)]
pub struct CloseMarketContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: fee vault account where rent/tokens are sent
    #[account(
        mut, 
        constraint = fee_vault.key() == config.fee_vault @ DepredictError::InvalidFeeVault
    )]
    pub fee_vault: AccountInfo<'info>,

    #[account(mut)]
    pub config: Box<Account<'info, Config>>,

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
        constraint = market.market_state == MarketStates::Resolved @ DepredictError::MarketStillActive
    )]
    pub market: Box<Account<'info, MarketState>>,

    // Mint needed for ATA derivation and transfer checks
    #[account(
        mut, 
        constraint = usdc_mint.key() == Pubkey::from_str(USDC_MINT).unwrap() @ DepredictError::InvalidMint
    )]
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    // Market vault to close, must exist
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = market,
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [POSITION.as_bytes(), &args.market_id.to_le_bytes()],
        bump,
    )]
    pub market_positions_account: Box<Account<'info, PositionAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> MarketContext<'info> {
    pub fn create_market(&mut self, args: CreateMarketArgs, bumps: &MarketContextBumps) -> Result<()> {
        let market = &mut self.market;
        let payer = &self.payer.to_account_info();
        let market_positions = &mut self.market_positions_account;
        let config = &mut self.config;
        let mpl_core_program = &self.mpl_core_program.to_account_info();
        let market_type = args.market_type;

        let ts = Clock::get()?.unix_timestamp;

        let oracle_pubkey: Option<Pubkey>;

        match args.oracle_type {
            OracleType::None => {
                msg!("No oracle type provided");
                oracle_pubkey = None;
            }
            OracleType::Switchboard => {
                msg!("Checking if oracle is valid");
                require!(is_valid_oracle(&self.oracle_pubkey)?, DepredictError::InvalidOracle);
                oracle_pubkey = Some(self.oracle_pubkey.key());
            }
        }

        msg!("Checking USDC mint is valid");
        require!(self.usdc_mint.key() == Pubkey::from_str(USDC_MINT).unwrap(), DepredictError::InvalidMint);


        let market_id = config.next_market_id();
        msg!("Market ID: {}", market_id);

        let betting_start = match market_type {
            MarketType::Live => args.market_start,
            MarketType::Future => {
                require!(args.betting_start.is_some(), DepredictError::InvalidBettingStart);
                args.betting_start.unwrap()
            },
        };

        market.set_inner(MarketState {
            bump: bumps.market,
            authority: payer.key(),
            market_id: market_id,
            betting_start,
            market_start: args.market_start,
            market_end: args.market_end,
            question: args.question,
            update_ts: ts,
            market_usdc_vault: Some(self.market_usdc_vault.key()),
            oracle_type: args.oracle_type,
            oracle_pubkey: oracle_pubkey,
            ..Default::default()
        });


        config.set_inner(Config {
            next_market_id: config.next_market_id,
            bump: config.bump,
            authority: config.authority,
            fee_vault: config.fee_vault,
            fee_amount: config.fee_amount,
            version: config.version,
            num_markets: config.num_markets.checked_add(1).ok_or(DepredictError::ArithmeticOverflow)?,
        });
    
        let mut positions = [Position::default(); 10];
        for pos in positions.iter_mut() {
            pos.position_status = PositionStatus::Init;
        }

        market_positions.set_inner(PositionAccount {
            bump: bumps.market_positions_account,
            authority: self.payer.key(),
            version: 0,
            positions,
            nonce: 0,
            market_id: market_id,
            is_sub_position: false,
            padding: [0; 10],
        });

        // Add debug logging for positions
        msg!("Initializing position slots:");
        for (i, pos) in market_positions.positions.iter().enumerate() {
            msg!("Position {}: status = {:?}", i, pos.position_status);
        }
    
        market.emit_market_event()?;


        msg!("Creating collection NFT");

        let market_nft_name = format!("DEPREDICT-MKT-{}", market_id);
        let mut create_collection_cpi = CreateCollectionV2CpiBuilder::new(mpl_core_program);
        let mut plugins: Vec<PluginAuthorityPair> = vec![];

        let attributes = Attributes {
            attribute_list: vec![
                Attribute {
                    key: "market_id".to_string(),
                    value: market.market_id.to_string(),
                },
            ],
        };

        plugins.push(
            PluginAuthorityPair { 
                plugin: Plugin::Attributes(attributes), 
                authority: Some(PluginAuthority::UpdateAuthority) 
            }
        );

        let system_program = &self.system_program.to_account_info();

        let collection_signer_seeds: &[&[u8]] = &[
            NFT_COLLECTION.as_bytes(),
            &market_id.to_le_bytes(),
            &[bumps.collection],
        ];

        create_collection_cpi
        .collection(&self.collection.to_account_info())
        .payer(&payer)
        .update_authority(Some(&market.to_account_info()))
        .system_program(&system_program)
        .name(market_nft_name)
        .uri(args.metadata_uri)
        .plugins(plugins)  
        .invoke_signed(&[collection_signer_seeds])?;


        market.nft_collection = Some(self.collection.key());
        market.emit_market_event()?;
        Ok(())
    }
}

impl<'info> UpdateMarketContext<'info> {
    pub fn update_market(&mut self, args: UpdateMarketArgs) -> Result<()> {
        let market = &mut self.market;
        let signer = &self.signer;
        let ts = Clock::get()?.unix_timestamp;

        // only the market creator can update the market
         require!(market.authority == *signer.key, DepredictError::Unauthorized);

        // Update only the fields that were passed in args
        if args.market_end.is_some() {
            market.market_end = args.market_end.unwrap();
        }
        if args.market_state.is_some() {
            //cannot update to resolved as resolution is done by the oracle
            require!(args.market_state.unwrap() != MarketStates::Resolved, DepredictError::MarketNotAllowedToPayout);
            market.market_state = args.market_state.unwrap();
        }
        market.update_ts = ts;
        Ok(())
    }
}

impl<'info> ResolveMarketContext<'info> {
    pub fn resolve_market(&mut self, args: ResolveMarketArgs) -> Result<()> {
        let market = &mut self.market;
        let signer = &self.signer;
        let oracle_type = market.oracle_type;

        let ts = Clock::get()?.unix_timestamp;

        require!(market.authority == *signer.key, DepredictError::Unauthorized);
        require!(market.market_state != MarketStates::Resolved, DepredictError::MarketAlreadyResolved);

        if oracle_type == OracleType::Switchboard {
            require!(self.oracle_pubkey.key() == market.oracle_pubkey.unwrap(), DepredictError::InvalidOracle);
        }

        // Get oracle price data
        let direction = match oracle_type {
            OracleType::None => {
                let value = args.oracle_value.unwrap();
                Decimal::from(value)
            },
            OracleType::Switchboard => get_oracle_value(&self.oracle_pubkey)?,
        };  
        
        msg!("Oracle or manual value: {:?}", direction);
        // Determine winning direction based on price
        let winning_direction = if direction == Decimal::from(10) {
            WinningDirection::No
        } else if direction == Decimal::from(11) {
            WinningDirection::Yes
        } else {
            msg!("Oracle not resolved");
            return Err(DepredictError::OracleNotResolved.into());
        };

        require!(winning_direction != WinningDirection::None, DepredictError::OracleNotResolved);
        msg!("Winning direction: {:?}", winning_direction);
        // Update market state

        market.winning_direction = winning_direction;
        market.market_state = MarketStates::Resolved;
        market.update_ts = ts;

        market.emit_market_event()?;

        Ok(())
    }
}


impl<'info> CloseMarketContext<'info> {
    pub fn close_market(&mut self, args: CloseMarketArgs) -> Result<()> {

        let market = &mut self.market;
        let signer = &self.signer;
        let config = &mut self.config;

        require!(market.authority == *signer.key, DepredictError::Unauthorized);

        let market_state = market.market_state;
        require!(market_state == MarketStates::Resolved, DepredictError::MarketStillActive);

        let market_id = self.market.market_id;
        require!(market_id == args.market_id, DepredictError::InvalidMarketId);

        let market_bump = self.market.bump;
        let market_signer: &[&[&[u8]]] = &[&[
            MARKET.as_bytes(),
            &market_id.to_le_bytes(),
            &[market_bump]
        ]];


        msg!("Before decrement - num_markets: {}", config.num_markets);
        config.num_markets = config.num_markets.checked_sub(1).ok_or(DepredictError::ArithmeticOverflow)?;
        msg!("After decrement - num_markets: {}", config.num_markets);

        // 1. Transfer remaining token liquidity (if any) from market vault to fee vault ATA
        if self.market_vault.amount > 0 {
            msg!("Transferring {} tokens from market vault before closing.", self.market_vault.amount);
            transfer_checked(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: self.market_vault.to_account_info(),
                        mint: self.usdc_mint.to_account_info(),
                        to: self.fee_vault_usdc_ata.to_account_info(),
                        authority: self.market.to_account_info(), // Market PDA is authority
                    },
                    market_signer,
                ),
                self.market_vault.amount,
                self.usdc_mint.decimals,
            )?;
        }

        // 2. Close the market's token ATA, sending its rent lamports to the fee_vault
        msg!("Closing market vault account: {}", self.market_vault.key());
        close_account(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                CloseAccount {
                    account: self.market_vault.to_account_info(),
                    destination: self.fee_vault.to_account_info(), // Lamport destination
                    authority: self.market.to_account_info(), // Market PDA is authority
                },
                market_signer
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

        // After closing the market account, close the positions account
        let positions_account_info = self.market_positions_account.to_account_info();
        let positions_lamports = positions_account_info.lamports();

        msg!("Closing market positions account: {}", positions_account_info.key());
        msg!("Transferring {} lamports from positions account to fee vault.", positions_lamports);

        // Transfer lamports to fee vault
        **positions_account_info.try_borrow_mut_lamports()? -= positions_lamports;
        **fee_vault_info.try_borrow_mut_lamports()? += positions_lamports;

        // Mark the market account data as closed by zeroizing (optional but good practice)
        // market_account_info.assign(&System::id()); // This reassigns owner
        // market_account_info.resize(0)?; // This might fail if rent epoch not met
        // A common way is to zero out the data manually if needed, 
        // but closing typically involves just reclaiming lamports.
        // Since Anchor doesn't have a direct `close_account_manually_to_recipient`,
        // transferring lamports like this is the way.
        // The account will be garbage collected eventually.

        Ok(())
    }
}
