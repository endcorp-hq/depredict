use anchor_lang::prelude::*;

use crate::events::OrderEvent;

#[account]
#[derive(InitSpace)]
pub struct UserTrade {
    pub bump: u8,
    pub authority: Pubkey,
    pub total_deposits: u64,
    pub total_withdraws: u64,
    pub version: u64,
    pub orders: [Order; 10],
    pub nonce: u32,
    pub is_sub_user: bool,
    pub padding: [u8; 25],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, InitSpace)]
pub struct Order {
    pub ts: i64,
    pub order_id: u64,
    pub market_id: u64,
    pub order_status: OrderStatus,
    pub price: u64,
    pub version: u64,
    pub order_direction: OrderDirection,
    pub user_nonce: u32,
    pub created_at: i64,
    pub padding: [u8; 3],
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct OpenOrderArgs {
    pub amount: u64,
    pub direction: OrderDirection,
}


#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug, Default, InitSpace)]
pub enum OrderStatus {
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

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug, Default, InitSpace)]
pub enum OrderDirection {
    #[default]
    Yes,
    No,
}


impl UserTrade {

    pub fn get_user_nonce(&self) -> u32 {
        if self.is_sub_user { self.nonce } else { 0 }
    }

    pub fn next_version(&mut self) {
        self.version = self.version.checked_add(1).unwrap();
    }

    pub fn emit_order_event(&self, order: Order, user_nonce: u32) -> Result<()> {
        emit!(OrderEvent {
            ts: order.ts,
            authority: self.authority,
            market_id: order.market_id,
            order_id: order.order_id,
            price: order.price,
            order_direction: order.order_direction,
            order_status: order.order_status,
            created_at: order.created_at,
            user_nonce,
        });

        Ok(())
    }
}
