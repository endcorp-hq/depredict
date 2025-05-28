use anchor_lang::prelude::*;
use anchor_lang::system_program::{ transfer, Transfer };
use anchor_spl::token::Token;
use anchor_spl::token_2022::{ transfer_checked, TransferChecked };
use anchor_spl::{ associated_token::AssociatedToken, token_interface::{ Mint, TokenAccount } };
use std::str::FromStr;

use crate::constants::USDC_MINT;
use crate::state::{Config, MarketStates, OpenOrderArgs, OrderStatus};
use crate::{
    constraints::is_authority_for_user_trade,
    errors::ShortxError,
    state::{ MarketState, Order, OrderDirection, UserTrade, WinningDirection },
};

#[derive(Accounts)]
pub struct OrderContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: multisig fee vault account
    #[account(
        mut, 
        constraint = fee_vault.key() == config.fee_vault @ ShortxError::InvalidFeeVault
    )]
    pub fee_vault: AccountInfo<'info>,

    #[account(
        mut,
        constraint = is_authority_for_user_trade(&user_trade, &signer)?
    )]
    pub user_trade: Box<Account<'info, UserTrade>>,

    #[account(mut)]
    pub market: Box<Account<'info, MarketState>>,

    #[account(
        mut, 
        constraint = mint.key() == Pubkey::from_str(USDC_MINT).unwrap() @ ShortxError::InvalidMint
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program
    )]
    pub user_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub market_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    
    pub config: Account<'info, Config>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> OrderContext<'info> {
    pub fn open_order(&mut self, args: OpenOrderArgs) -> Result<()> {
        let market = &mut self.market;
        let user_trade = &mut self.user_trade;
    
        let ts = Clock::get()?.unix_timestamp;
    
        // Add logs for timestamp comparison
        msg!("Current cluster timestamp (ts): {}", ts);
        msg!("Market start timestamp (market.market_start): {}", market.market_start);
        msg!("Is ts > market.market_start? {}", ts > market.market_start);

        require!(ts > market.market_start, ShortxError::QuestionPeriodNotStarted);
        require!(market.market_end > ts, ShortxError::QuestionPeriodEnded);
        require!(
            market.winning_direction == WinningDirection::None,
            ShortxError::MarketAlreadyResolved
        );
    
        // this ensures multiple orders are not created at the same time
        require!(ts > market.update_ts, ShortxError::ConcurrentTransaction);
    
        let net_amount = args.amount;
    
        let ( current_liquidity, otherside_current_liquidity) = match args.direction {
            OrderDirection::Yes => (market.yes_liquidity, market.no_liquidity),
            OrderDirection::No => (market.no_liquidity, market.yes_liquidity),
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
        
    
        let order_index = user_trade.orders
            .iter()
            .position(
                |order|
                    order.order_status != OrderStatus::Open
            )
            .ok_or(ShortxError::NoAvailableOrderSlot)?;
    
            
        msg!("Order Index {:?}", order_index);

        let user_nonce = user_trade.get_user_nonce();
        msg!("User Nonce {:?}", user_nonce);
        user_trade.orders[order_index] = Order {
            ts,
            order_id: market.next_order_id(),
            market_id: market.market_id,
            order_status: OrderStatus::Open,
            price: net_amount,
            order_direction: args.direction,
            user_nonce,
            created_at: ts,
            padding: [0; 3],
            version: 0,
        };
    
        user_trade.total_deposits = user_trade.total_deposits.checked_add(net_amount).unwrap();
    
        market.volume = market.volume.checked_add(net_amount).unwrap();

        match args.direction {
            OrderDirection::Yes => {
                market.yes_liquidity = market.yes_liquidity.checked_add(net_amount).unwrap();
            }
            OrderDirection::No => {
                market.no_liquidity = market.no_liquidity.checked_add(net_amount).unwrap();
            }
        }
       
        msg!("Transfer Checked, net_amount {:?}, mint {:?}, to {:?}, authority {:?}, balance {:?}, user balance {:?}", net_amount, self.mint.to_account_info(), self.market_vault.to_account_info(), self.signer.to_account_info(), self.market_vault.amount, self.user_ata.amount);
        transfer_checked(
            CpiContext::new(self.token_program.to_account_info(), TransferChecked {
                from: self.user_ata.to_account_info(),
                mint: self.mint.to_account_info(),
                to: self.market_vault.to_account_info(),
                authority: self.signer.to_account_info(),
            }),
            net_amount,
            self.mint.decimals
        )?;
    
        let current_order = user_trade.orders[order_index];
    
        user_trade.emit_order_event(current_order, user_nonce)?;
    
        let fee = self.config.fee_amount;
    
        let transfer_result = transfer(
            CpiContext::new(self.system_program.to_account_info(), Transfer {
                from: self.signer.to_account_info(),
                to: self.fee_vault.to_account_info(),
            }),
            fee
        );
    
        if let Err(_) = transfer_result {
            return Err(ShortxError::InsufficientFunds.into());
        }
    
        require!(ts > market.update_ts, ShortxError::ConcurrentTransaction);
    
        market.update_ts = ts;
    
        market.emit_market_event()?;
    
        Ok(())
    }


    pub fn payout_order(&mut self, order_id: u64) -> Result<()> {
        let market = &mut self.market;
        let user_trade = &mut self.user_trade;
        let ts = Clock::get()?.unix_timestamp;
    
        require!(
            market.winning_direction != WinningDirection::None,
            ShortxError::MarketStillActive
        );
        require!(market.market_state == MarketStates::Resolved, ShortxError::MarketNotAllowedToPayout);
    
        let user_nonce = user_trade.get_user_nonce();
    
        let order_index = user_trade.orders
            .iter()
            .position(|order| {
                order.order_id == order_id &&
                    order.order_status == OrderStatus::Open &&
                    order.market_id == market.market_id
            })
            .ok_or(ShortxError::OrderNotFound)?;
    
        let order = user_trade.orders[order_index];
    
        let is_winner = match (order.order_direction, market.winning_direction) {
            | (OrderDirection::Yes, WinningDirection::Yes)
            | (OrderDirection::No, WinningDirection::No) => true,
            _ => false,
        };
    
        let mut payout = 0;
    
        if is_winner {
            let winning_liquidity_percentage = order.price.checked_div(market.yes_liquidity).unwrap();
            payout = market.no_liquidity.checked_mul(winning_liquidity_percentage).unwrap() + order.price;
        }
    
        
        if payout > 0 && is_winner {
            let signer: &[&[&[u8]]] = &[&[b"market", &market.market_id.to_le_bytes(), &[market.bump]]];
    
            
                transfer_checked(
                    CpiContext::new_with_signer(
                        self.token_program.to_account_info(),
                        TransferChecked {
                            from: self.market_vault.to_account_info(),
                            mint: self.mint.to_account_info(),
                            to: self.user_ata.to_account_info(),
                            authority: market.to_account_info(),
                        },
                        signer
                    ),
                    payout,
                    self.mint.decimals
                )?;
            
    
            user_trade.total_withdraws = user_trade.total_withdraws.checked_add(payout).unwrap();
    
            msg!("Market Liquidity {:?}", self.market_vault.amount);
            msg!("Order Price {:?}", order.price);
            msg!("Payout {:?}", payout);
        }
    
        user_trade.orders[order_index].order_status = OrderStatus::Closed;
        user_trade.orders[order_index].ts = ts;
    
        user_trade.emit_order_event(user_trade.orders[order_index], user_nonce)?;
    
        require!(ts > market.update_ts, ShortxError::ConcurrentTransaction);
    
        market.update_ts = ts;
    
        market.emit_market_event()?;
    
        Ok(())
    }
}

