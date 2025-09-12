// anchor includes
use anchor_lang::{
    prelude::*
};
use anchor_spl::{ 
    associated_token::AssociatedToken, 
    token_interface::{ 
        Mint, TokenAccount 
    },
    token::{
        Token, 
        TransferChecked, 
        transfer_checked
    } 
};

// crate includes
use crate::{
    constants::{
        BASE_URI, MARKET, MARKET_CREATOR, MPL_ACCOUNT_COMPRESSION_ID, MPL_NOOP_ID, POSITION_PAGE
    }, errors::DepredictError, state::{
        ClosePositionArgs, MarketCreator, MarketState, MarketStates, MarketType, OpenPositionArgs, PositionDirection, PositionPage, PositionStatus, WinningDirection, POSITION_PAGE_ENTRIES
    }
};


// metaplex includes
use mpl_bubblegum::{
    instructions::MintV2CpiBuilder,
    programs::MPL_BUBBLEGUM_ID,
    types::{MetadataArgsV2, TokenStandard},
    accounts::TreeConfig
};
use mpl_core::programs::{
    MPL_CORE_ID
};

//misc includes
use borsh::BorshDeserialize;
use std::str::FromStr;
use switchboard_on_demand::prelude::rust_decimal::Decimal;


#[derive(Accounts)]
#[instruction(args: OpenPositionArgs)]
pub struct PositionContext<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: multisig fee vault account
    #[account(
        mut, 
        constraint = market_fee_vault.key() == market_creator.fee_vault @ DepredictError::InvalidFeeVault
    )]
    pub market_fee_vault: AccountInfo<'info>,

    // Paged positions account for this market and page index
    #[account(
        init_if_needed,
        payer = user,
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

    /// CHECK: Market creator account that owns this market
    #[account(
        constraint = market_creator.key() == market.market_creator @ DepredictError::InvalidCollection
    )]
    pub market_creator: Box<Account<'info, MarketCreator>>,

    #[account(
        mut, 
        constraint = mint.key() == market.mint.unwrap() @ DepredictError::InvalidMint
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
        associated_token::token_program = token_program
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,

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
#[instruction(args: ClosePositionArgs)]
pub struct PayoutContext<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,

    #[account(mut)]
    pub market: Box<Account<'info, MarketState>>,

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
        constraint = mint.key() == market.mint.unwrap() @ DepredictError::InvalidMint
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
        associated_token::token_program = token_program
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


impl<'info> PositionContext<'info> {
    pub fn open_position(&mut self, args: OpenPositionArgs) -> Result<()> {

        let market = &mut self.market;
        let next_position_id = market.next_position_id(); // increment and fetch
        let market_type = market.market_type;
        let position_page = &mut self.position_page;
        let ts = Clock::get()?.unix_timestamp;
    
        // Collection is provided as an account and constrained to match market creator's collection in the accounts struct

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
        
        // Helper to find target page and free slot
        let target_page: &mut PositionPage = position_page;
        target_page.market_id = market.market_id;
        target_page.page_index = args.page_index;

        let mut position_index: Option<usize> = None;
        for i in 0..POSITION_PAGE_ENTRIES {
            if target_page.entries[i].status != PositionStatus::Open { position_index = Some(i); break; }
        }

        require!(position_index.is_some(), DepredictError::NoAvailablePositionSlot);
        let position_index = position_index.unwrap();
        msg!("Position Index {:?} (page {:?})", position_index, target_page.page_index);

        // Update entry; leaf_index will be set after minting
        let was_init = target_page.entries[position_index].status == PositionStatus::Init;
        target_page.entries[position_index].amount = net_amount;
        target_page.entries[position_index].direction = args.direction;
        target_page.entries[position_index].status = PositionStatus::Open;
        target_page.entries[position_index].position_id = next_position_id;
        target_page.entries[position_index].created_at = ts;
        if was_init { target_page.count = target_page.count.saturating_add(1); }
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
                authority: self.user.to_account_info(),
            }),
            net_amount,
            self.mint.decimals
        )?;
    
        // Emit minimal event via existing structure if needed (optional)
        // TODO: Fix fee structure. Need to transfer fees form users to market creator, then on market resolution + payout, transfer fees from market creator to depredict protocol. Users get paid, then market makers, then protocol. 
        // let fee = self.config.fee_amount;
    
        // let transfer_result = transfer(
        //     CpiContext::new(self.system_program.to_account_info(), Transfer {
        //         from: self.user.to_account_info(),
        //         to: self.market_fee_vault.to_account_info(),
        //     }),
        //     fee
        // );
    
        // if let Err(_) = transfer_result {
        //     return Err(DepredictError::InsufficientFunds.into());
        // }
    
        // require!(ts > market.update_ts, DepredictError::ConcurrentTransaction);
    
        // market.update_ts = ts;
    
        // market.emit_market_event()?;

            // Build uri = {base_uri}/{marketId}/{positionId}.json from fixed bytes
            let uri = format!("{}/{}/{}.json", BASE_URI, market.market_id, next_position_id);
            let name = format!("DEPREDICT-{}-{}", market.market_id, next_position_id);

            // Build MetadataArgsV2 with required fields for mpl-bubblegum 2.1.1
            let metadata = MetadataArgsV2 {
                name,
                symbol: String::from(""),
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
            

            // Create the seeds and bump for the market creator PDA
            let market_creator_seeds = &[
                MARKET_CREATOR.as_bytes(),
                &self.market_creator.authority.to_bytes(),
                &[self.market_creator.bump]
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
            
            // Use invoke_signed to provide the seeds for the market creator PDA
            builder.invoke_signed(market_creator_signer_seeds)?;

            let mut tree_config_data: &[u8] = &self.tree_config.try_borrow_data()?;
            let tree_account = TreeConfig::deserialize(&mut tree_config_data)?;
            msg!("tree_account {:?}", tree_account);
            let leaf_index = tree_account.num_minted - 1;
            msg!("leaf_index {:?}", leaf_index);

            let (asset_id, _bump) = Pubkey::find_program_address(
                &[
                    b"asset",
                    self.merkle_tree.key().as_ref(),
                    &leaf_index.to_le_bytes(),
                ],
                &MPL_BUBBLEGUM_ID,
            );
            // TODO: Consider emitting a dedicated PositionClaimed event with asset_id,
            msg!("Position created; Assset ID {:?}", asset_id);

            target_page.entries[position_index].asset_id = asset_id;
            target_page.entries[position_index].leaf_index = leaf_index as u64;
     Ok(())
    }
}


impl<'info> PayoutContext<'info> {
    pub fn payout_position(&mut self, args: ClosePositionArgs) -> Result<()> {

        let market = &mut self.market;
        let position_page = &mut self.position_page;
        let ts = Clock::get()?.unix_timestamp;
        // TODO: Verify Merkle inclusion of leaf using proof accounts once wired
        let asset_id = args.asset_id;

        // Auth: signer must be the claimer or the market creator authority
        let signer_key = self.claimer.key();
        let claimer_key = self.claimer.key();
        let is_market_creator = signer_key == self.market_creator.authority;
        require!(signer_key == claimer_key || is_market_creator, DepredictError::Unauthorized);
        // Market creator cannot redirect payout to themselves
        require!(claimer_key != self.market_creator.authority, DepredictError::Unauthorized);

        // Determine the slot index: use provided value or search by asset_id
        let effective_slot_index: usize = if let Some(idx) = args.slot_index { 
            let idx_usize = idx as usize; 
            require!(idx_usize < POSITION_PAGE_ENTRIES, DepredictError::PositionNotFound);
            require!(position_page.entries[idx_usize].asset_id == asset_id, DepredictError::InvalidNft);
            idx_usize
        } else {
            let mut found: Option<usize> = None;
            for i in 0..POSITION_PAGE_ENTRIES { 
                if position_page.entries[i].status == PositionStatus::Open && position_page.entries[i].asset_id == asset_id { found = Some(i); break; }
            }
            require!(found.is_some(), DepredictError::PositionNotFound);
            found.unwrap()
        };
        // Check market is resolved
        require!(
            market.winning_direction != WinningDirection::None,
            DepredictError::MarketStillActive
        );
        require!(market.market_state == MarketStates::Resolved, DepredictError::MarketNotAllowedToPayout);

        require!(effective_slot_index < POSITION_PAGE_ENTRIES, DepredictError::PositionNotFound);
        // Must be Open
        require!(position_page.entries[effective_slot_index].status == PositionStatus::Open, DepredictError::PositionNotFound);
        require!(position_page.entries[effective_slot_index].asset_id == args.asset_id && position_page.entries[effective_slot_index].asset_id != Pubkey::default(), DepredictError::InvalidNft);

        // TODO: Verify compressed asset leaf belongs to `claimer` via Bubblegum proof CPI.
        //       - Add leaf proof accounts (root, index, hash path) to context
        //       - CPI to Bubblegum verify leaf and extract owner
        //       - require!(extracted_owner == claimer_key, DepredictError::InvalidNft)

        // Check if position won
        let position_direction = position_page.entries[effective_slot_index].direction;
        let is_winner = match (position_direction, market.winning_direction) {
            (PositionDirection::Yes, WinningDirection::Yes) |
            (PositionDirection::No, WinningDirection::No) => true,
            _ => false,
        };

        let position_amount = position_page.entries[effective_slot_index].amount;
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
            msg!("User ATA amount before transfer: {}", self.claimer_mint_ata.amount);

            transfer_checked(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    TransferChecked {
                        from: self.market_vault.to_account_info(),
                        mint: self.mint.to_account_info(),
                        to: self.claimer_mint_ata.to_account_info(),
                        authority: market.to_account_info(),
                    },
                    market_signer
                ),
                payout,
                self.mint.decimals
            )?;
        }

        position_page.entries[effective_slot_index].status = PositionStatus::Claimed;

        require!(ts > market.update_ts, DepredictError::ConcurrentTransaction);
        market.update_ts = ts;
        // TODO: Emit a specific payout/settlement event rather than the full market event. Probs redesign all events to be more specific.
        market.emit_market_event()?;

        msg!("Payout completed successfully");
        Ok(())
    }
}

