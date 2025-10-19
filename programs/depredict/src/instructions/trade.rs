// anchor includes
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer_checked, Token, TransferChecked},
    token_interface::{Mint, TokenAccount},
};

// crate includes
use crate::events::{ClosePositionEvent, OpenPositionEvent};
use crate::{
    constants::{
        CONFIG, MARKET, MARKET_CREATOR, MAX_CREATOR_POSITIONS, MPL_ACCOUNT_COMPRESSION_ID,
        MPL_NOOP_ID, POSITIONS_PER_PAGE, POSITION_PAGE,
    },
    errors::DepredictError,
    helpers::compute_dual_fees_sequential,
    state::{
        Config, MarketCreator, MarketState, MarketStates, MarketType, OpenPositionArgs,
        PositionDirection, PositionPage, PositionStatus, SettlePositionArgs, WinningDirection,
        POSITION_PAGE_ENTRIES,
    },
};
// metaplex includes
use mpl_bubblegum::{
    accounts::TreeConfig,
    instructions::{BurnV2CpiBuilder, MintV2CpiBuilder},
    programs::MPL_BUBBLEGUM_ID,
    types::{MetadataArgsV2, TokenStandard},
};
// use mpl_bubblegum::types::LeafSchema; // adjust path if needed
// use mpl_bubblegum::utils::hash_leaf_v1;            // adjust path if needed
use mpl_core::programs::MPL_CORE_ID;

//misc includes
use borsh::BorshDeserialize;
use std::str::FromStr;
use switchboard_on_demand::prelude::rust_decimal::Decimal;
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct EnsurePageArgs {
    pub page_index: u16,
}

#[derive(Accounts)]
#[instruction(args: EnsurePageArgs)]
pub struct EnsurePositionPageContext<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut,
        seeds = [MARKET.as_bytes(), &market.market_id.to_le_bytes()],
        bump
    )]
    pub market: Box<Account<'info, MarketState>>,

    /// CHECK: must match market.market_creator
    #[account(mut, constraint = market_creator.key() == market.market_creator @ DepredictError::InvalidMarketCreator)]
    pub market_creator: Box<Account<'info, MarketCreator>>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + PositionPage::INIT_SPACE,
        seeds = [POSITION_PAGE.as_bytes(), &market.market_id.to_le_bytes(), &args.page_index.to_le_bytes()],
        bump
    )]
    pub position_page: Box<Account<'info, PositionPage>>,

    pub system_program: Program<'info, System>,
}

impl<'info> EnsurePositionPageContext<'info> {
    pub fn ensure(&mut self, args: EnsurePageArgs) -> Result<()> {
        // Enforce creator-wide page budget: pages_allocated + 1 <= MAX_CREATOR_POSITIONS / POSITIONS_PER_PAGE
        let max_pages = MAX_CREATOR_POSITIONS
            .checked_div(POSITIONS_PER_PAGE)
            .ok_or(DepredictError::ArithmeticOverflow)?;
        require!(
            (self.market_creator.pages_allocated as u32) < max_pages,
            DepredictError::Overflow
        );

        // When init_if_needed triggers, Anchor allocates space and zeros the account.
        // Populate minimal header fields so downstream code can rely on them.
        self.position_page.market_id = self.market.market_id;
        self.position_page.page_index = args.page_index;
        // Accounted as one page allocation for the creator if this was a new init; best-effort detect via count==0 and market_id/page_index zero check
        // In Anchor, we cannot directly know if init_if_needed ran, so we increment conservatively if header is zeroed.
        if self.position_page.count == 0 {
            self.market.pages_allocated = self
                .market
                .pages_allocated
                .checked_add(1)
                .ok_or(DepredictError::ArithmeticOverflow)?;
            self.market_creator.pages_allocated = self
                .market_creator
                .pages_allocated
                .checked_add(1)
                .ok_or(DepredictError::ArithmeticOverflow)?;
        }
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(args: OpenPositionArgs)]
pub struct OpenPositionContext<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// current page PDA; program verifies/derives and uses it
    #[account(mut)]
    pub position_page: Box<Account<'info, PositionPage>>,

    #[account(mut,
        seeds = [MARKET.as_bytes(), &market.market_id.to_le_bytes()],
        bump
    )]
    pub market: Box<Account<'info, MarketState>>,

    /// CHECK: Market creator account that owns this market
    #[account(
        mut,
        constraint = market_creator.key() == market.market_creator @ DepredictError::InvalidCollection
    )]
    pub market_creator: Box<Account<'info, MarketCreator>>,

    #[account(
        mut,
        constraint = market.mint == Some(mint.key()) @ DepredictError::InvalidMint
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user,
        associated_token::token_program = token_program
    )]
    pub user_mint_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = market,
        associated_token::token_program = token_program,
        constraint = market.market_vault == Some(market_vault.key()) @ DepredictError::InvalidFeeVault
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: merkle tree account (must be writable; Bubblegum updates it)
    #[account(mut, constraint = merkle_tree.key() == market_creator.merkle_tree @ DepredictError::InvalidTree)]
    pub merkle_tree: AccountInfo<'info>,

    /// CHECK: collection account (writable; may be touched by CPI)
    #[account(mut, constraint = collection.key() == market_creator.core_collection @ DepredictError::InvalidCollection)]
    pub collection: AccountInfo<'info>,

    /// CHECK: TreeConfig PDA for the merkle tree (writable)
    #[account(mut)]
    pub tree_config: AccountInfo<'info>,

    /// CHECK: MPL Core CPI signer
    #[account(mut)]
    pub mpl_core_cpi_signer: AccountInfo<'info>,

    /// CHECK: MPL Core program
    #[account(address = MPL_CORE_ID)]
    pub mpl_core_program: AccountInfo<'info>,

    /// CHECK: Bubblegum program
    #[account(address = MPL_BUBBLEGUM_ID)]
    pub bubblegum_program: AccountInfo<'info>,

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
#[instruction(args: SettlePositionArgs)]
pub struct SettlePositionContext<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,

    #[account(mut)]
    pub market: Box<Account<'info, MarketState>>,

    // Global protocol config (for protocol fee and fee vault)
    #[account(
        seeds = [CONFIG.as_bytes()],
        bump = config.bump
    )]
    pub config: Box<Account<'info, Config>>,

    /// CHECK: ensure the passed market creator matches the market's configured market_creator
    #[account(
        constraint = market_creator.key() == market.market_creator @ DepredictError::InvalidMarketCreator
    )]
    pub market_creator: Box<Account<'info, MarketCreator>>,

    #[account(
        mut,
        seeds = [POSITION_PAGE.as_bytes(), &market.market_id.to_le_bytes(), &args.page_index.to_le_bytes()],
        bump
    )]
    pub position_page: Box<Account<'info, PositionPage>>,

    #[account(
        mut,
        constraint = market.mint == Some(mint.key()) @ DepredictError::InvalidMint
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = claimer,
        associated_token::mint = mint,
        associated_token::authority = claimer,
        associated_token::token_program = token_program
    )]
    pub claimer_mint_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = market,
        associated_token::token_program = token_program,
        constraint = market.market_vault == Some(market_vault.key()) @ DepredictError::InvalidFeeVault
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: MPL Core program
    #[account(address = MPL_CORE_ID)]
    pub mpl_core_program: AccountInfo<'info>,

    /// CHECK: Bubblegum program
    #[account(address = MPL_BUBBLEGUM_ID)]
    pub bubblegum_program: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,

    /// CHECK: merkle tree account
    #[account(mut, constraint = merkle_tree.key() == market_creator.merkle_tree @ DepredictError::InvalidTree)]
    pub merkle_tree: AccountInfo<'info>,

    /// CHECK: collection account
    #[account(mut, constraint = collection.key() == market_creator.core_collection @ DepredictError::InvalidCollection)]
    pub collection: AccountInfo<'info>,

    /// CHECK: TreeConfig PDA for the merkle tree
    #[account(mut)]
    pub tree_config: AccountInfo<'info>,

    /// CHECK: MPL Core CPI signer
    #[account(mut)]
    pub mpl_core_cpi_signer: AccountInfo<'info>,

    /// CHECK: Log wrapper (mpl-noop)
    #[account(address = Pubkey::from_str(MPL_NOOP_ID).unwrap())]
    pub log_wrapper_program: AccountInfo<'info>,

    /// CHECK: Account compression program (mpl-account-compression)
    #[account(address = Pubkey::from_str(MPL_ACCOUNT_COMPRESSION_ID).unwrap())]
    pub compression_program: AccountInfo<'info>,
}

impl<'info> OpenPositionContext<'info> {
    pub fn open_position(&mut self, args: OpenPositionArgs) -> Result<OpenPositionEvent> {
        let market = &mut self.market;
        let next_position_id = market.next_position_id();
        let market_type = market.market_type;
        let clock = Clock::get()?;
        let ts = clock.unix_timestamp;
        let slot = clock.slot;
        let net_amount = args.amount;

        if market_type == MarketType::Future {
            require!(
                ts < market.market_start && ts > market.betting_start,
                DepredictError::BettingPeriodExceeded
            );
        }

        require!(market.market_end > ts, DepredictError::BettingPeriodEnded);
        require!(
            market.winning_direction == WinningDirection::None,
            DepredictError::MarketAlreadyResolved
        );
        require!(
            slot >= market.last_update_slot,
            DepredictError::ConcurrentTransaction
        );
        if slot == market.last_update_slot {
            require!(
                ts >= market.update_ts,
                DepredictError::ConcurrentTransaction
            );
        }
        require!(
            self.market_creator.verified,
            DepredictError::MarketCreatorInactive
        );
        require!(
            self.position_page.market_id == market.market_id,
            DepredictError::InvalidMarketId
        );

        let (current_liquidity, otherside_current_liquidity) = match args.direction {
            PositionDirection::Yes => (market.yes_liquidity, market.no_liquidity),
            PositionDirection::No => (market.no_liquidity, market.yes_liquidity),
        };

        msg!("current liquidity {:?}", current_liquidity);
        msg!(
            "otherside current liquidity {:?}",
            otherside_current_liquidity
        );
        msg!("Net Amount {:?}", net_amount);

        let new_directional_liquidity = current_liquidity.checked_add(net_amount).unwrap();
        msg!("new directional liquidity {:?}", new_directional_liquidity);
        let markets_liquidity = new_directional_liquidity
            .checked_add(otherside_current_liquidity)
            .unwrap();
        msg!("markets liquidity {:?}", markets_liquidity);

        // Ensure headers are populated
        self.position_page.market_id = market.market_id;

        let mut slot_index: Option<usize> = None;

        // search current page first
        for i in 0..POSITION_PAGE_ENTRIES {
            if self.position_page.entries[i].status == PositionStatus::Init {
                slot_index = Some(i);
                break;
            }
        }

        if slot_index.is_none() {
            // No available slots in current page
            msg!("No available slots in current page");
            return err!(DepredictError::NoAvailablePositionSlot);
        }
        let idx = slot_index.unwrap();
        msg!(
            "Position Index {:?} (page {:?})",
            idx,
            self.position_page.page_index
        );

        // Snapshot existing entry status to determine if we increment count

        let was_init = self.position_page.entries[idx].status == PositionStatus::Init;

        // Build local position to avoid borrow conflicts across CPIs
        let mut position = self.position_page.entries[idx];
        position.amount = net_amount;
        position.direction = args.direction;
        position.status = PositionStatus::Open;
        position.position_id = next_position_id;
        position.created_at = ts;

        // Market accounting
        market.volume = market.volume.checked_add(net_amount).unwrap();
        match args.direction {
            PositionDirection::Yes => {
                market.yes_liquidity = market.yes_liquidity.checked_add(net_amount).unwrap();
            }
            PositionDirection::No => {
                market.no_liquidity = market.no_liquidity.checked_add(net_amount).unwrap();
            }
        }

        // Transfer funds in
        transfer_checked(
            CpiContext::new(
                self.token_program.to_account_info(),
                TransferChecked {
                    from: self.user_mint_ata.to_account_info(),
                    mint: self.mint.to_account_info(),
                    to: self.market_vault.to_account_info(),
                    authority: self.user.to_account_info(),
                },
            ),
            net_amount,
            self.mint.decimals,
        )?;
        msg!("Transferred funds to market vault");

        // Mint cNFT to user and collection
        msg!("Minting cNFT");
        let symbol = format!("{}-{}", market.market_id, next_position_id);
        let uri = args.metadata_uri;
        let name = format!("DEPREDICT-{}-{}", market.market_id, next_position_id);
        let metadata = MetadataArgsV2 {
            name,
            symbol: String::from(symbol),
            uri,
            seller_fee_basis_points: 0,
            primary_sale_happened: false,
            is_mutable: false,
            token_standard: Some(TokenStandard::NonFungible),
            collection: Some(self.market_creator.core_collection),
            creators: vec![],
        };
        let market_creator = &self.market_creator.to_account_info();
        let payer = self.user.to_account_info();
        let leaf_owner = self.user.to_account_info();
        let system = self.system_program.to_account_info();
        let market_creator_seeds = &[
            MARKET_CREATOR.as_bytes(),
            &self.market_creator.authority.to_bytes(),
            &[self.market_creator.bump],
        ];
        let market_creator_signer_seeds: &[&[&[u8]]] = &[&market_creator_seeds[..]];
        let mut builder = MintV2CpiBuilder::new(&self.bubblegum_program);
        builder
            .tree_config(&self.tree_config)
            .payer(&payer)
            .tree_creator_or_delegate(Some(market_creator))
            .collection_authority(Some(market_creator))
            .leaf_owner(&leaf_owner)
            .leaf_delegate(Some(&payer))
            .merkle_tree(&self.merkle_tree)
            .core_collection(Some(&self.collection))
            .mpl_core_cpi_signer(Some(&self.mpl_core_cpi_signer))
            .log_wrapper(&self.log_wrapper_program)
            .compression_program(&self.compression_program)
            .mpl_core_program(&self.mpl_core_program)
            .system_program(&system)
            .metadata(metadata);
        builder.invoke_signed(market_creator_signer_seeds)?;

        // Fetch leaf index and asset id
        let mut tree_config_data: &[u8] = &self.tree_config.try_borrow_data()?;
        let tree_account = TreeConfig::deserialize(&mut tree_config_data)?;
        let leaf_index = tree_account.num_minted - 1;
        let (asset_id, _bump) = Pubkey::find_program_address(
            &[
                b"asset",
                self.merkle_tree.key().as_ref(),
                &leaf_index.to_le_bytes(),
            ],
            &MPL_BUBBLEGUM_ID,
        );
        msg!("Position created; Assset ID {:?}", asset_id);

        // Complete local position and persist to chosen page
        position.asset_id = asset_id;
        position.leaf_index = leaf_index as u64;
        self.position_page.entries[idx] = position;
        if was_init {
            self.position_page.count = self.position_page.count.saturating_add(1);
        }

        // Mark update time and return
        market.update_ts = ts;
        market.last_update_slot = slot;

        let open_position_event = OpenPositionEvent {
            market_id: market.market_id,
            position_id: next_position_id,
            mint: Some(self.mint.key()),
            position_nonce: 0,
            position_status: PositionStatus::Open,
            ts: ts,
            created_at: ts,
            amount: net_amount,
            direction: args.direction,
            asset_id,
            payer: self.user.key(),
            vault: self.market_vault.key(),
            currency_decimals: self.mint.decimals,
        };

        emit!(open_position_event);
        Ok(open_position_event)
    }
}

impl<'info> SettlePositionContext<'info> {
    pub fn settle_position(
        &mut self,
        args: SettlePositionArgs,
        proof_accounts: &[AccountInfo<'info>],
    ) -> Result<ClosePositionEvent> {
        let market = &mut self.market;
        let position_page = &mut self.position_page;
        let clock = Clock::get()?;
        let ts = clock.unix_timestamp;
        let slot = clock.slot;
        let asset_id = args.asset_id;
        let claimer_key = self.claimer.key();

        // Market must be resolved
        require!(
            market.market_state == MarketStates::Resolved,
            DepredictError::MarketStillActive
        );

        // Optional: prevent creator authority from claiming
        require!(
            claimer_key != self.market_creator.authority,
            DepredictError::Unauthorized
        );
        require!(
            self.market_creator.verified,
            DepredictError::MarketCreatorInactive
        );
        require!(
            position_page.market_id == market.market_id,
            DepredictError::InvalidMarketId
        );

        // Locate slot by provided index or search by asset_id
        let effective_slot_index: usize = if let Some(idx) = args.slot_index {
            let idx_usize = idx as usize;
            require!(
                idx_usize < POSITION_PAGE_ENTRIES,
                DepredictError::PositionNotFound
            );
            require!(
                position_page.entries[idx_usize].asset_id == asset_id,
                DepredictError::InvalidNft
            );
            idx_usize
        } else {
            let mut found: Option<usize> = None;
            for i in 0..POSITION_PAGE_ENTRIES {
                if position_page.entries[i].status == PositionStatus::Open
                    && position_page.entries[i].asset_id == asset_id
                {
                    found = Some(i);
                    break;
                }
            }
            require!(found.is_some(), DepredictError::PositionNotFound);
            found.unwrap()
        };

        require!(
            effective_slot_index < POSITION_PAGE_ENTRIES,
            DepredictError::PositionNotFound
        );
        require!(
            position_page.entries[effective_slot_index].status == PositionStatus::Open,
            DepredictError::PositionNotFound
        );
        require!(
            position_page.entries[effective_slot_index].asset_id == args.asset_id
                && position_page.entries[effective_slot_index].asset_id != Pubkey::default(),
            DepredictError::InvalidNft
        );
        require!(
            position_page.entries[effective_slot_index].leaf_index == u64::from(args.leaf_index),
            DepredictError::InvalidNft
        );

        // Determine win status and potential payout
        let position_direction = position_page.entries[effective_slot_index].direction;
        let is_winner = match (position_direction, market.winning_direction) {
            (PositionDirection::Yes, WinningDirection::Yes)
            | (PositionDirection::No, WinningDirection::No) => true,
            _ => false,
        };

        let position_amount_raw = position_page.entries[effective_slot_index].amount;
        let mut payout: u64 = 0;
        if is_winner {
            let (winning_liquidity, otherside_liquidity) = match position_direction {
                PositionDirection::Yes => (market.yes_liquidity, market.no_liquidity),
                PositionDirection::No => (market.no_liquidity, market.yes_liquidity),
            };

            let position_amount = Decimal::from(position_amount_raw);
            let winning_liquidity = Decimal::from(winning_liquidity);
            let otherside_liquidity = Decimal::from(otherside_liquidity);

            let winning_percentage = position_amount
                .checked_div(winning_liquidity)
                .ok_or(DepredictError::ArithmeticOverflow)?;

            let share_of_otherside = otherside_liquidity
                .checked_mul(winning_percentage)
                .ok_or(DepredictError::ArithmeticOverflow)?;

            let total_payout = share_of_otherside
                .checked_add(position_amount)
                .ok_or(DepredictError::ArithmeticOverflow)?;

            payout = total_payout
                .try_into()
                .map_err(|_| DepredictError::ArithmeticOverflow)?;
        }

        // Gate by cNFT ownership/permission: burn first (CPI enforces permission)
        {
            let claimer_info = self.claimer.to_account_info();
            let system_info = self.system_program.to_account_info();
            let mut burn_builder = BurnV2CpiBuilder::new(&self.bubblegum_program);
            burn_builder
                .tree_config(&self.tree_config)
                .payer(&claimer_info)
                .authority(Some(&claimer_info))
                .leaf_owner(&claimer_info)
                .merkle_tree(&self.merkle_tree)
                .core_collection(Some(&self.collection))
                .mpl_core_cpi_signer(Some(&self.mpl_core_cpi_signer))
                .log_wrapper(&self.log_wrapper_program)
                .compression_program(&self.compression_program)
                .mpl_core_program(&self.mpl_core_program)
                .system_program(&system_info)
                .root(args.root)
                .data_hash(args.data_hash)
                .creator_hash(args.creator_hash)
                .nonce(args.nonce)
                .index(args.leaf_index);

            if !proof_accounts.is_empty() {
                let mut proof_meta: Vec<(&AccountInfo<'info>, bool, bool)> =
                    Vec::with_capacity(proof_accounts.len());
                for account in proof_accounts {
                    proof_meta.push((account, account.is_writable, account.is_signer));
                }
                burn_builder.add_remaining_accounts(&proof_meta);
            }
            burn_builder.invoke()?;
        }
        msg!("cNFT burned");

        // If winner, transfer payout (after successful burn gating)
        if payout > 0 && is_winner {
            let (_creator_fee, _protocol_fee, net_payout) = compute_dual_fees_sequential(
                payout,
                self.market_creator.creator_fee_bps,
                self.config.fee_amount,
            )?;
            if net_payout > 0 {
                let market_signer: &[&[&[u8]]] = &[&[
                    MARKET.as_bytes(),
                    &market.market_id.to_le_bytes(),
                    &[market.bump],
                ]];
                transfer_checked(
                    CpiContext::new_with_signer(
                        self.token_program.to_account_info(),
                        TransferChecked {
                            from: self.market_vault.to_account_info(),
                            mint: self.mint.to_account_info(),
                            to: self.claimer_mint_ata.to_account_info(),
                            authority: market.to_account_info(),
                        },
                        market_signer,
                    ),
                    net_payout,
                    self.mint.decimals,
                )?;
            }
        }

        // Mark as claimed and update timestamp
        position_page.entries[effective_slot_index].status = PositionStatus::Claimed;
        require!(
            slot >= market.last_update_slot,
            DepredictError::ConcurrentTransaction
        );
        if slot == market.last_update_slot {
            require!(
                ts >= market.update_ts,
                DepredictError::ConcurrentTransaction
            );
        }
        market.update_ts = ts;
        market.last_update_slot = slot;
        market.emit_market_event()?;

        let close_position_event = ClosePositionEvent {
            market_id: market.market_id,
            position_id: position_page.entries[effective_slot_index].position_id,
            amount: position_page.entries[effective_slot_index].amount,
            direction: position_page.entries[effective_slot_index].direction,
            position_status: PositionStatus::Claimed,
            asset_id: position_page.entries[effective_slot_index].asset_id,
            currency_decimals: self.mint.decimals,
        };
        emit!(close_position_event);
        Ok(close_position_event)
    }
}

// --- Prune a position entry (market creator authority only) ---

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PrunePositionArgs {
    pub page_index: u16,
    pub slot_index: u8,
}

#[derive(Accounts)]
#[instruction(args: PrunePositionArgs)]
pub struct PrunePositionContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut,
        seeds = [MARKET.as_bytes(), &market.market_id.to_le_bytes()],
        bump
    )]
    pub market: Box<Account<'info, MarketState>>,

    #[account(
        constraint = market_creator.key() == market.market_creator @ DepredictError::InvalidMarketCreator,
        constraint = market_creator.authority == signer.key() @ DepredictError::Unauthorized,
    )]
    pub market_creator: Box<Account<'info, MarketCreator>>,

    #[account(
        mut,
        seeds = [POSITION_PAGE.as_bytes(), &market.market_id.to_le_bytes(), &args.page_index.to_le_bytes()],
        bump
    )]
    pub position_page: Box<Account<'info, PositionPage>>,
}

impl<'info> PrunePositionContext<'info> {
    pub fn prune(&mut self, args: PrunePositionArgs) -> Result<()> {
        let page = &mut self.position_page;
        let idx = args.slot_index as usize;
        require!(
            idx < POSITION_PAGE_ENTRIES,
            DepredictError::PositionNotFound
        );

        let status = page.entries[idx].status;
        require!(
            status == PositionStatus::Claimed || status == PositionStatus::Closed,
            DepredictError::PositionNotPrunable
        );

        // Zero the slot fields and decrement count
        page.entries[idx].asset_id = Pubkey::default();
        page.entries[idx].amount = 0;
        page.entries[idx].direction = PositionDirection::default();
        page.entries[idx].status = PositionStatus::Init;
        page.entries[idx].position_id = 0;
        page.entries[idx].leaf_index = 0;
        page.entries[idx].created_at = 0;
        page.count = page.count.saturating_sub(1);
        Ok(())
    }
}

// --- Close an empty position page and reclaim rent ---

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ClosePositionPageArgs {
    pub page_index: u16,
}

#[derive(Accounts)]
#[instruction(args: ClosePositionPageArgs)]
pub struct ClosePositionPageContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut,
        seeds = [MARKET.as_bytes(), &market.market_id.to_le_bytes()],
        bump
    )]
    pub market: Box<Account<'info, MarketState>>,

    #[account(
        mut,
        constraint = market_creator.key() == market.market_creator @ DepredictError::InvalidMarketCreator,
        constraint = market_creator.authority == signer.key() @ DepredictError::Unauthorized,
    )]
    pub market_creator: Box<Account<'info, MarketCreator>>,

    #[account(
        mut,
        seeds = [POSITION_PAGE.as_bytes(), &market.market_id.to_le_bytes(), &args.page_index.to_le_bytes()],
        bump,
        close = signer
    )]
    pub position_page: Box<Account<'info, PositionPage>>,
}

impl<'info> ClosePositionPageContext<'info> {
    pub fn close_page(&mut self, _args: ClosePositionPageArgs) -> Result<()> {
        // Page must be empty to close
        require!(
            self.position_page.count == 0,
            DepredictError::PositionPageNotEmpty
        );
        // Market must be resolved
        require!(
            self.market.market_state == MarketStates::Resolved,
            DepredictError::MarketStillActive
        );
        // Decrement counters/budget
        self.market.pages_allocated = self.market.pages_allocated.saturating_sub(1);
        self.market_creator.pages_allocated = self.market_creator.pages_allocated.saturating_sub(1);
        Ok(())
    }
}
