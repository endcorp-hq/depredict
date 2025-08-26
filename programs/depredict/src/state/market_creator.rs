use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct MarketCreator {
    pub bump: u8,
    pub authority: Pubkey,           // The wallet that owns this market creator account
    pub core_collection: Pubkey,     // The MPL Core collection NFT mint address
    pub collection_authority: Pubkey, // The collection authority that can manage the collection
    #[max_len(100)]
    pub name: String,                // Display name for the market creator
    pub created_at: i64,            // Timestamp when this market creator was created
    pub num_markets: u64,           // Number of markets created by this creator
    pub is_active: bool,             // Whether this market creator is active
    pub version: u64,               // Version for future upgrades
    pub padding: [u8; 32],         // Padding for future fields
}

impl Default for MarketCreator {
    fn default() -> Self {
        Self {
            bump: 0,
            authority: Pubkey::default(),
            core_collection: Pubkey::default(),
            collection_authority: Pubkey::default(),
            name: String::new(),
            created_at: 0,
            num_markets: 0,
            is_active: true,
            version: 1,
            padding: [0; 32],
        }
    }
}

impl MarketCreator {
    pub fn increment_market_count(&mut self) {
        self.num_markets = self.num_markets.checked_add(1).unwrap();
    }

    pub fn next_version(&mut self) {
        self.version = self.version.checked_add(1).unwrap();
    }

    pub fn is_authority(&self, authority: &Pubkey) -> bool {
        self.authority == *authority
    }

    pub fn is_collection_authority(&self, collection_authority: &Pubkey) -> bool {
        self.collection_authority == *collection_authority
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateMarketCreatorArgs {
    pub name: String,
    pub core_collection: Pubkey,
    pub collection_authority: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateMarketCreatorArgs {
    pub name: Option<String>,
    pub is_active: Option<bool>,
}
