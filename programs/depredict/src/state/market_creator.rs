use anchor_lang::prelude::*;

#[derive(InitSpace)]
#[account]
pub struct MarketCreator {
    pub bump: u8,
    pub authority: Pubkey, // The wallet that owns this market creator account
    pub core_collection: Pubkey, // The MPL Core collection NFT mint address
    pub merkle_tree: Pubkey, // The global tree address
    #[max_len(30)]
    pub name: String, // Display name for the market creator
    pub created_at: i64,   // Timestamp when this market creator was created
    pub num_markets: u64,  // Number of markets created by this creator
    pub active_markets: u8, // Currently active/open markets
    pub pages_allocated: u16, // Total pages allocated across all active markets
    pub fee_vault: Pubkey, // The vault that holds the fees for the market creator
    pub creator_fee_bps: u16, // The fee percentage for the market creator
    pub verified: bool,    // Whether the market creator has been verified with a valid collection
}

impl Default for MarketCreator {
    fn default() -> Self {
        Self {
            bump: 0,
            authority: Pubkey::default(),
            core_collection: Pubkey::default(),
            merkle_tree: Pubkey::default(),
            name: String::new(),
            created_at: 0,
            num_markets: 0,
            active_markets: 0,
            pages_allocated: 0,
            fee_vault: Pubkey::default(),
            creator_fee_bps: 0,
            verified: false,
        }
    }
}

impl MarketCreator {
    pub fn increment_market_count(&mut self) {
        self.num_markets = self.num_markets.checked_add(1).unwrap();
    }

    pub fn is_authority(&self, authority: &Pubkey) -> bool {
        self.authority == *authority
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateMarketCreatorArgs {
    pub name: String,
    pub fee_vault: Pubkey,
    pub creator_fee_bps: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VerifyMarketCreatorArgs {
    pub core_collection: Pubkey,
    pub merkle_tree: Pubkey,
}
