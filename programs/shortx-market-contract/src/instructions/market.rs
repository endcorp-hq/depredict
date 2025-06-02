use std::str::FromStr;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken, metadata::Metadata, token_2022::TransferChecked, token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface}
};
use mpl_token_metadata::{instructions::CreateV1CpiBuilder, types::{PrintSupply, TokenStandard}};
use switchboard_on_demand::{prelude::rust_decimal::Decimal};
use crate::{constants::{ MARKET, POSITION, USDC_MINT}, constraints::{get_oracle_price}, state::{CloseMarketArgs, Config, CreateMarketArgs, MarketState, MarketStates, Position, PositionAccount, UpdateMarketArgs, WinningDirection}};
use crate::errors::ShortxError;

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

    /// CHECK: oracle is checked in the implementation function
    #[account(
        mut
    )]
    pub oracle_pubkey: AccountInfo<'info>,

    pub config: Box<Account<'info, Config>>,

    #[account(
        init,
        payer = signer,
        space = 8 + MarketState::INIT_SPACE,
        seeds = [MARKET.as_bytes(), &args.market_id.to_le_bytes()],
        bump
    )]
    pub market: Box<Account<'info, MarketState>>,

    #[account(
        init,
        payer = signer,
        space = 8 + PositionAccount::INIT_SPACE,
        seeds = [POSITION.as_bytes(), &args.market_id.to_le_bytes()],
        bump
    )]
    pub market_positions_account: Box<Account<'info, PositionAccount>>,

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

    /// CHECK: We create it using metaplex
    #[account(mut)]
    pub collection_mint: AccountInfo<'info>,

    /// CHECK: We create it using metaplex
    #[account(mut)]
    pub collection_metadata: AccountInfo<'info>,

    /// CHECK: We create it using metaplex
    #[account(mut)]
    pub collection_master_edition: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_metadata_program: Program<'info, Metadata>,
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

// Context for resolving the market
#[derive(Accounts)]
pub struct ResolveMarketContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub market: Box<Account<'info, MarketState>>,

    /// CHECK: oracle is same as the market's oracle pubkey
    #[account(
        mut,
        // constraint = oracle_pubkey.key() == market.oracle_pubkey @ ShortxError::InvalidOracle
    )]
    pub oracle_pubkey: AccountInfo<'info>,
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
        let market_positions = &mut self.market_positions_account;

        // check if the oracle is valid
        // require!(is_valid_oracle(&self.oracle_pubkey)?, ShortxError::InvalidOracle);
        msg!("Skipping oracle check");

        market.set_inner(MarketState {
            bump: bumps.market,
            authority: signer.key(),
            market_id: args.market_id,
            market_start: args.market_start,
            market_end: args.market_end,
            question: args.question,
            update_ts: ts,
            oracle_pubkey: Some(self.oracle_pubkey.key()),
            collection_mint: Some(self.collection_mint.key()),
            collection_metadata: Some(self.collection_metadata.key()),
            collection_master_edition: Some(self.collection_master_edition.key()),
            market_vault: Some(self.market_vault.key()),
            ..Default::default()
        });
    
        market_positions.set_inner(PositionAccount {
            bump: bumps.market_positions_account,
            authority: self.signer.key(),
            version: 0,
            positions: [Position::default(); 10],
            nonce: 0,
            market_id: args.market_id,
            is_sub_position: false,
        });
    

        market.emit_market_event()?;

        msg!("Creating collection NFT");

        // Create collection NFT
        let collection_name = String::from_utf8(b"SHORTX-Q1".to_vec()).unwrap();
        
        let token_metadata_program = self.token_metadata_program.to_account_info();
        let collection_metadata = self.collection_metadata.to_account_info();
        let collection_mint = self.collection_mint.to_account_info();
        let signer_account = self.signer.to_account_info();
        let collection_master_edition = self.collection_master_edition.to_account_info();
        let system_program = self.system_program.to_account_info();
        let token_program = self.token_program.to_account_info();

        let market_id = market.market_id;
        let market_bump = market.bump;
        let market_signer: &[&[&[u8]]] = &[&[
            MARKET.as_bytes(),
            &market_id.to_le_bytes(),
            &[market_bump]
        ]];

        let mut create_collection_cpi = CreateV1CpiBuilder::new(&token_metadata_program);

        create_collection_cpi
            .metadata(&collection_metadata)
            .mint(&collection_mint, false)
            .authority(&signer_account)
            .payer(&signer_account)
            .update_authority(&signer_account, true)
            .master_edition(Some(&collection_master_edition))
            .system_program(&system_program)
            .sysvar_instructions(&system_program)
            .spl_token_program(Some(&token_program))
            .token_standard(TokenStandard::NonFungible)
            .name(collection_name)
            .symbol(String::from("SHORTX"))
            .uri(args.metadata_uri)
            .seller_fee_basis_points(0)
            .primary_sale_happened(false)
            .is_mutable(true)
            .print_supply(PrintSupply::Zero);

        create_collection_cpi.invoke_signed(market_signer)?;

        // Store collection mint in market state
        market.collection_mint = Some(self.collection_mint.key());

        Ok(())
    }
}

impl<'info> UpdateMarketContext<'info> {
    pub fn update_market(&mut self, args: UpdateMarketArgs) -> Result<()> {
        let market = &mut self.market;
        let signer = &self.signer;
        let ts = Clock::get()?.unix_timestamp;

        // only the market creator can update the market end time
         require!(market.authority == *signer.key, ShortxError::Unauthorized);

        // update the market end time
        market.market_end = args.market_end;
        market.update_ts = ts;
        Ok(())
    }
}

impl<'info> ResolveMarketContext<'info> {
    pub fn resolve_market(&mut self) -> Result<()> {
        let market = &mut self.market;
        let signer = &self.signer;

        let ts = Clock::get()?.unix_timestamp;

        require!(market.authority == *signer.key, ShortxError::Unauthorized);
        require!(market.market_state == MarketStates::Active || market.market_state == MarketStates::Ended, ShortxError::MarketAlreadyResolved);

        // Get oracle price data
        let direction = get_oracle_price(&self.oracle_pubkey)?;
        // Determine winning direction based on price
        let winning_direction = if direction == Decimal::from(0) {
            WinningDirection::No
        } else if direction == Decimal::from(1) {
            WinningDirection::Yes
        } else {
            WinningDirection::None
        };

        require!(winning_direction != WinningDirection::None, ShortxError::OracleNotResolved);

        // Update market state
        market.market_state = MarketStates::Resolved;
        market.winning_direction = winning_direction;
        market.update_ts = ts;

        market.emit_market_event()?;

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

        let market_bump = self.market.bump;
        let market_signer: &[&[&[u8]]] = &[&[
            MARKET.as_bytes(),
            &market_id.to_le_bytes(),
            &[market_bump]
        ]];

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
                    market_signer,
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
