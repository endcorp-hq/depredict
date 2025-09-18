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

use switchboard_on_demand::{prelude::rust_decimal::Decimal};
use crate::{constants::{ 
    MARKET, POSITION_PAGE
    }, 
    constraints::{
        get_oracle_value, 
        is_valid_oracle
    }, 
    state::{
        CloseMarketArgs, Config, CreateMarketArgs, MarketState, MarketStates, MarketType, OracleType, ResolveMarketArgs, UpdateMarketArgs, WinningDirection, MarketCreator
    }
};
use crate::errors::DepredictError;

#[derive(Accounts)]
#[instruction(args: CreateMarketArgs)]
pub struct CreateMarketContext<'info> {
    /// CHECK: Market creator account that will own this market
    #[account(
        mut,
        constraint = market_creator.authority == payer.key() @ DepredictError::Unauthorized,
    )]
    pub market_creator: Box<Account<'info, MarketCreator>>,

    #[account(mut)]
    pub payer: Signer<'info>,
    
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

    // Pre-initialize first position page (page 0)
    #[account(
        init,
        payer = payer,
        space = 8 + crate::state::trade::PositionPage::INIT_SPACE,
        seeds = [POSITION_PAGE.as_bytes(), &config.next_market_id.to_le_bytes(), &0u16.to_le_bytes()],
        bump
    )]
    pub position_page0: Box<Account<'info, crate::state::trade::PositionPage>>,

    #[account(
        mut,
        // check that the mint is owned by the token program
        owner = token_program.key() @ DepredictError::InvalidMint
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = market, // vault should be owned by the market PDA
        associated_token::token_program = token_program,
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    
    /// CHECK: oracle is checked in the implementation function
    #[account(mut)]
    pub oracle_pubkey: AccountInfo<'info>,

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
        constraint = market.market_creator == signer.key() @ DepredictError::Unauthorized
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
        constraint = market.market_creator == market_creator.key() @ DepredictError::InvalidMarketCreator
    )]
    pub market: Box<Account<'info, MarketState>>,

    /// Market creator account that owns this market
    #[account(
        constraint = market_creator.authority == signer.key() @ DepredictError::Unauthorized
    )]
    pub market_creator: Box<Account<'info, MarketCreator>>,

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
        constraint = protocol_fee_vault.key() == config.fee_vault @ DepredictError::InvalidFeeVault
    )]
    pub protocol_fee_vault: AccountInfo<'info>,

    #[account(mut)]
    pub config: Box<Account<'info, Config>>,

    // Protocol fee vault token account (must match stored pubkey and mint)
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = protocol_fee_vault,
        constraint = protocol_fee_vault_ata.mint == mint.key() @ DepredictError::InvalidMint,
    )]
    pub protocol_fee_vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = market_creator.authority == signer.key() @ DepredictError::Unauthorized
    )]
    pub market_creator: Box<Account<'info, MarketCreator>>,

    // Creator fee vault token account (must match stored pubkey and mint)
    #[account(
        mut,
        constraint = creator_fee_vault_ata.owner == market_creator.fee_vault @ DepredictError::InvalidFeeVault,
        constraint = creator_fee_vault_ata.mint == mint.key() @ DepredictError::InvalidMint
    )]
    pub creator_fee_vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,
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
        // check that the mint is owned by the token program
        owner = token_program.key() @ DepredictError::InvalidMint
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    // Market vault to close, must exist
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = market,
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateMarketContext<'info> {
    pub fn create_market(&mut self, args: CreateMarketArgs, bumps: &CreateMarketContextBumps) -> Result<()> {
        let market = &mut self.market;
        let config = &mut self.config;
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
        
        let market_id = config.next_market_id();
        msg!("Market ID: {}", market_id);

        let betting_start = match market_type {
            MarketType::Live => args.market_start,
            MarketType::Future => {
                require!(args.betting_start.is_some(), DepredictError::InvalidBettingStart);
                args.betting_start.unwrap()
            },
        };

        // Store the actual PDA bump so signer seeds work for CPIs (e.g., payouts)
        let market_bump = bumps.market;
        
        market.set_inner(MarketState {
            bump: market_bump,
            market_creator: self.market_creator.key(),
            market_id: market_id,
            betting_start,
            market_start: args.market_start,
            market_end: args.market_end,
            question: args.question,
            update_ts: ts,
            market_vault: Some(self.market_vault.key()),
            mint: Some(self.mint.key()),
            decimals: self.mint.decimals,
            oracle_type: args.oracle_type,
            oracle_pubkey: oracle_pubkey,
            nft_collection: Some(self.market_creator.core_collection),
            ..Default::default()
        });

        // initialize page 0 header
        self.position_page0.market_id = market_id;
        self.position_page0.page_index = 0u16;
        self.position_page0.count = 0;
        self.position_page0.prewarm_next = false;
        market.pages_allocated = market.pages_allocated.checked_add(1).ok_or(DepredictError::ArithmeticOverflow)?;

        // Increment market count and track creator active markets
        self.market_creator.increment_market_count();
        self.market_creator.active_markets = self
            .market_creator
            .active_markets
            .checked_add(1)
            .ok_or(DepredictError::ArithmeticOverflow)?;

        config.global_markets = config
            .global_markets
            .checked_add(1)
            .ok_or(DepredictError::ArithmeticOverflow)?;
    
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
         require!(market.market_creator == *signer.key, DepredictError::Unauthorized);

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

        // Check if the signer is the authority of the market creator
        require!(self.market_creator.authority == *signer.key, DepredictError::Unauthorized);
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
        let market_creator = &mut self.market_creator;

        require!(market.market_creator == *signer.key, DepredictError::Unauthorized);

        let market_state = market.market_state;
        require!(market_state == MarketStates::Resolved, DepredictError::MarketStillActive);

        let market_id = market.market_id;
        require!(market_id == args.market_id, DepredictError::InvalidMarketId);

        let market_bump = market.bump;
        let market_signer: &[&[&[u8]]] = &[&[
            MARKET.as_bytes(),
            &market_id.to_le_bytes(),
            &[market_bump]
        ]];


        msg!("Before decrement - num_markets: {}", config.global_markets);
        config.global_markets = config.global_markets.checked_sub(1).ok_or(DepredictError::ArithmeticOverflow)?;
        msg!("After decrement - num_markets: {}", config.global_markets);

        // 1. Distribute remaining token liquidity from market vault to creator and protocol
        let total_remaining: u64 = self.market_vault.amount;
        if total_remaining > 0 {
            let creator_bps: u64 = market_creator.creator_fee_bps as u64;
            let protocol_bps: u64 = config.fee_amount as u64;
            let sum_bps: u64 = creator_bps
                .checked_add(protocol_bps)
                .ok_or(DepredictError::ArithmeticOverflow)?;

            // Compute creator share proportionally: total * creator_bps / (creator_bps + protocol_bps), rounded down
            let creator_share: u64 = if sum_bps == 0 {
                0
            } else {
                let numerator: u128 = (total_remaining as u128)
                    .checked_mul(creator_bps as u128)
                    .ok_or(DepredictError::ArithmeticOverflow)?;
                let denom: u128 = sum_bps as u128;
                u64::try_from(numerator / denom).map_err(|_| DepredictError::ArithmeticOverflow)?
            };
            let protocol_share: u64 = total_remaining
                .checked_sub(creator_share)
                .ok_or(DepredictError::ArithmeticOverflow)?;

            // First, transfer creator share (if any)
            if creator_share > 0 {
                transfer_checked(
                    CpiContext::new_with_signer(
                        self.token_program.to_account_info(),
                        TransferChecked {
                            from: self.market_vault.to_account_info(),
                            mint: self.mint.to_account_info(),
                            to: self.creator_fee_vault_ata.to_account_info(),
                            authority: market.to_account_info(),
                        },
                        market_signer,
                    ),
                    creator_share,
                    self.mint.decimals,
                )?;
            }

            // Then, transfer the remainder to the protocol vault (covers both proportional share and sum_bps==0 case)
            if protocol_share > 0 {
                transfer_checked(
                    CpiContext::new_with_signer(
                        self.token_program.to_account_info(),
                        TransferChecked {
                            from: self.market_vault.to_account_info(),
                            mint: self.mint.to_account_info(),
                            to: self.protocol_fee_vault_ata.to_account_info(),
                            authority: market.to_account_info(),
                        },
                        market_signer,
                    ),
                    protocol_share,
                    self.mint.decimals,
                )?;
            }
        }

        // 2. Close the market's token ATA, sending its rent lamports to the fee_vault
        msg!("Closing market vault account: {}", self.market_vault.key());
        close_account(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                CloseAccount {
                    account: self.market_vault.to_account_info(),
                    destination: self.creator_fee_vault_ata.to_account_info(), // Lamport destination
                    authority: market.to_account_info(), // Market PDA is authority
                },
                market_signer
            )
        )?;

        let market_account_info = self.market.to_account_info();
        let fee_vault_info = self.creator_fee_vault_ata.to_account_info();
        let market_lamports = market_account_info.lamports();

        msg!("Closing market account: {}", market_account_info.key());
        msg!("Transferring {} lamports from market account to fee vault.", market_lamports);

        **market_account_info.try_borrow_mut_lamports()? -= market_lamports;
        **fee_vault_info.try_borrow_mut_lamports()? += market_lamports;        

        // Mark the market account data as closed by zeroizing (optional but good practice)
        market_account_info.resize(0)?; // This might fail if rent epoch not met
        market_account_info.assign(&System::id()); // This reassigns owner
        Ok(())
    }
}
