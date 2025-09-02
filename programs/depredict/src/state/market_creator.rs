use anchor_lang::prelude::*;


#[derive(InitSpace)]
#[account]
pub struct MarketCreator {
    pub bump: u8,
    pub authority: Pubkey,           // The wallet that owns this market creator account
    pub core_collection: Pubkey,     // The MPL Core collection NFT mint address
    #[max_len(30)]
    pub name: String,                // Display name for the market creator
    pub created_at: i64,            // Timestamp when this market creator was created
    pub num_markets: u64,           // Number of markets created by this creator
    pub fee_vault: Pubkey,          // The vault that holds the fees for the market creator
    pub verified: bool,             // Whether the market creator has been verified with a valid collection
}

impl Default for MarketCreator {
    fn default() -> Self {
        Self {
            bump: 0,
            authority: Pubkey::default(),
            core_collection: Pubkey::default(),
            name: String::new(),
            created_at: 0,
            num_markets: 0,
            fee_vault: Pubkey::default(),
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
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateMarketCreatorArgs {
    pub name: Option<String>,
    pub fee_vault: Option<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VerifyMarketCreatorArgs {
    pub core_collection: Pubkey,
}
