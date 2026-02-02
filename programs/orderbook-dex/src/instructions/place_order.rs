use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    errors::OrderBookError,
    states::{LimitOrder, Market, OrderBook},
    Side,
};

#[derive(Accounts)]
pub struct PlaceOrder<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    #[account(
        mut, 
        seeds=[b"market", base_mint.key().as_ref(), quote_mint.key().as_ref()], 
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub base_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub quote_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,

    #[account(
        mut, 
        associated_token::mint = base_mint, 
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub base_mint_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut, 
        associated_token::mint = quote_mint, 
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub quote_mint_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub trader_base_mint_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub trader_quote_mint_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut, 
        seeds=[b"market_orderBook", market.key().as_ref()], 
        bump
    )]
    pub order_book: Account<'info, OrderBook>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> PlaceOrder<'info> {
    pub fn place_order(&mut self, price: u64, amount: u64, side: Side) -> Result<()> {
        let order_book = &mut self.order_book;

        let order_id = order_book.next_order_id;
        order_book.next_order_id = order_book.next_order_id.checked_add(1).unwrap();

        let new_order = LimitOrder {
            owner: self.trader.key(),
            price,
            amount,
            order_id,
        };

        match side {
            Side::Bid => {
                require!(
                    order_book.bids.len() < OrderBook::MAX_ORDERS,
                    OrderBookError::OrderBookFull
                );

                // Calculate quote amount: (amount * price) / 10^base_decimals
                // This normalizes the result to quote token units
                let base_scale = 10u64.pow(self.base_mint.decimals as u32);
                let quote_price = amount
                    .checked_mul(price)
                    .ok_or(OrderBookError::ErrorInMultiply)?
                    .checked_div(base_scale)
                    .ok_or(OrderBookError::ErrorInMultiply)?;

                let ctx_acc = TransferChecked {
                    from: self.trader_quote_mint_account.to_account_info(),
                    to: self.quote_mint_vault.to_account_info(),
                    mint: self.quote_mint.to_account_info(),
                    authority: self.trader.to_account_info(),
                };

                let ctx_quote = CpiContext::new(self.token_program.to_account_info(), ctx_acc);

                token_interface::transfer_checked(
                    ctx_quote,
                    quote_price,
                    self.quote_mint.decimals,
                )?;

                order_book.bids.push(new_order);
            }
            Side::Ask => {
                require!(
                    order_book.asks.len() < OrderBook::MAX_ORDERS,
                    OrderBookError::OrderBookFull
                );

                let ctx_acc = TransferChecked {
                    from: self.trader_base_mint_account.to_account_info(),
                    to: self.base_mint_vault.to_account_info(),
                    mint: self.base_mint.to_account_info(),
                    authority: self.trader.to_account_info(),
                };

                let ctx = CpiContext::new(self.token_program.to_account_info(), ctx_acc);

                token_interface::transfer_checked(ctx, amount, self.base_mint.decimals)?;

                order_book.asks.push(new_order);
            }
        };

        Ok(())
    }
}
