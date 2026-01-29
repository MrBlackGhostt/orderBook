use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    states::{Market, OrderBook},
    LimitOrder, Side,
};

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    ///CHECK: this is the trader whose order is being cancel
    #[account(mut)]
    pub trader: Signer<'info>,

    ///CHECK:This is the makert account
    pub market: Account<'info, Market>,

    #[account(mut, seeds=[b"market_orderBook", market.key().as_ref()], bump)]
    pub order_book: Account<'info, OrderBook>,

    #[account(mut)]
    pub trader_base_mint_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub trader_quote_mint_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> CancelOrder<'info> {
    pub fn cancel_order(&mut self, side: Side, order_id: u64) -> Result<()> {
        match side {
            Side::Bid => self.order_book.bids.retain(|bid: &LimitOrder| {
                !(bid.order_id == order_id && bid.owner == self.trader.key())
            }),

            Side::Ask => self.order_book.asks.retain(|bid: &LimitOrder| {
                !(bid.order_id == order_id && bid.owner == self.trader.key())
            }),
        }
        Ok(())
    }
}
