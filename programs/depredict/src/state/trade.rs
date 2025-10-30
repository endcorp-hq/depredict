use anchor_lang::prelude::*;

// use crate::events::PositionEvent; // legacy event emitter no longer used

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct OpenPositionArgs {
    pub amount: u64,
    pub direction: PositionDirection,
    pub metadata_uri: String,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SettlePositionArgs {
    // page and position details
    pub page_index: u16,
    pub slot_index: Option<u8>,
    // bubblegum details loaded and passed from DAS
    pub asset_id: Pubkey,
    pub root: [u8; 32],
    pub data_hash: [u8; 32],
    pub creator_hash: [u8; 32],
    pub nonce: u64,
    pub leaf_index: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct MintPositionArgs {
    pub position_id: u64,
    pub metadata_uri: String,
}

#[derive(
    Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug, Default, InitSpace,
)]
pub enum PositionStatus {
    /// The order is not in use
    #[default]
    Init,
    /// Order is open
    Open,
    /// Order has been closed
    Closed,
    /// Order has been claimed
    Claimed,
}

#[derive(
    Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug, Default, InitSpace,
)]
pub enum PositionDirection {
    #[default]
    Yes,
    No,
}

impl std::fmt::Display for PositionDirection {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PositionDirection::Yes => write!(f, "Yes"),
            PositionDirection::No => write!(f, "No"),
        }
    }
}

pub const POSITION_PAGE_ENTRIES: usize = 16;

#[account]
#[derive(InitSpace)]
pub struct PositionPage {
    pub bump: u8,
    pub market_id: u64,
    pub page_index: u16,
    pub count: u8,
    pub prewarm_next: bool,
    pub entries: [Position; POSITION_PAGE_ENTRIES],
    pub padding: [u8; 5],
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, InitSpace, PartialEq, Eq, Debug)]
pub struct Position {
    pub asset_id: Pubkey,
    pub amount: u64,
    pub direction: PositionDirection,
    pub status: PositionStatus,
    pub position_id: u64,
    pub leaf_index: u64,
    pub created_at: i64,
}
