use anchor_lang::prelude::*;

use crate::events::PositionEvent;

#[account]
#[derive(InitSpace)]
pub struct PositionAccount {
    pub bump: u8,
    pub market_id: u64,
    pub authority: Pubkey,
    pub version: u64,
    pub positions: [Position; 10],
    pub nonce: u32,
    pub is_sub_position: bool,
    pub padding: [u8; 10],
}

#[account]
#[derive(Copy, InitSpace)]
pub struct Position {
    pub position_id: u64,          // Unique ID in the market
    pub market_id: u64,         // Which market this position is for
    pub amount: u64,               // Bet amount
    pub direction: PositionDirection, // YES/NO
    pub created_at: i64,
    pub ts: i64,                   // Timestamp
    pub mint: Option<Pubkey>,      // NFT asset mint address
    pub position_status: PositionStatus,
    pub position_nonce: u32,
    pub padding: [u8; 3],
    pub version: u64,
}

impl Default for Position {
    fn default() -> Self {
        Self {
            position_id: 0,
            market_id: 0,
            amount: 0,
            direction: PositionDirection::default(),
            created_at: 0,
            ts: 0,
            mint: None,
            position_status: PositionStatus::Init,
            position_nonce: 0,
            padding: [0; 3],
            version: 0,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct OpenPositionArgs {
    pub amount: u64,
    pub direction: PositionDirection,
    pub metadata_uri: String,
    pub page_index: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PayoutNftArgs {
    pub position_id: u64,
    pub market_id: u64,
    pub amount: u64,
    pub direction: PositionDirection,
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

impl PositionAccount {

    pub fn get_position_nonce(&self) -> u32 {
        if self.is_sub_position { self.nonce } else { 0 }
    }


    pub fn next_version(&mut self) {
        self.version = self.version.checked_add(1).unwrap();
    }

    pub fn emit_position_event(&self, position: Position) -> Result<()> {
        emit!(PositionEvent {
            ts: position.ts,
            position_id: position.position_id,
            market_id: position.market_id,
            mint: position.mint,
            position_nonce: position.position_nonce,
            amount: position.amount,
            direction: position.direction,
            created_at: position.created_at,
            position_status: position.position_status,
        });

        Ok(())
    }
}

pub const POSITION_PAGE_ENTRIES: usize = 64;

#[account]
#[derive(InitSpace)]
pub struct PositionPage {
    pub bump: u8,
    pub market_id: u64,
    pub page_index: u32,
    pub count: u16,
    pub entries: [PositionEntryLite; POSITION_PAGE_ENTRIES],
    pub padding: [u8; 6],
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, InitSpace, PartialEq, Eq, Debug)]
pub struct PositionEntryLite {
    pub leaf_index: u64,
    pub amount: u64,
    pub direction: PositionDirection,
    pub status: PositionStatus,
}
