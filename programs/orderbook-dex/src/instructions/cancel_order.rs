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

    #[account(mut, 
        seeds=[b"market", base_mint.key().as_ref(), quote_mint.key().as_ref()], 
        bump
)]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub base_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub quote_mint: InterfaceAccount<'info, Mint>,

    #[account(mut, seeds=[b"market_orderBook", market.key().as_ref()], bump)]
    pub order_book: Account<'info, OrderBook>,

    #[account(mut)]
    pub base_mint_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub quote_mint_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub trader_base_mint_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub trader_quote_mint_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> CancelOrder<'info> {
    pub fn cancel_order(&mut self, side: Side, order_id: u64, bump: u8) -> Result<()> {
        let market = self.market.key();
        let quote_mint = self.quote_mint.key();
        let base_mint = self.base_mint.key();

        let seeds = &[b"market", base_mint.as_ref(), quote_mint.as_ref(), &[bump]];

        let signer_seeds = &[&seeds[..]];
        let orderbook = &self.order_book;

        match side {
            Side::Bid => {
                let mut quote_amount: u64 = 0;

                for bid in &orderbook.bids {
                    if bid.order_id == order_id {
                        quote_amount = bid.amount.checked_mul(bid.price).unwrap();
                    }
                }

                self.order_book.bids.retain(|bid: &LimitOrder| {
                    !(bid.order_id == order_id && bid.owner == self.trader.key())
                });

                let ctx_acc = TransferChecked {
                    mint: self.quote_mint.to_account_info(),
                    from: self.quote_mint_vault.to_account_info(),
                    to: self.trader_quote_mint_account.to_account_info(),
                    authority: self.market.to_account_info(),
                };

                let ctx_refund = CpiContext::new(self.token_program.to_account_info(), ctx_acc)
                    .with_signer(signer_seeds);
                token_interface::transfer_checked(
                    ctx_refund,
                    quote_amount,
                    self.quote_mint.decimals,
                )?;
            }

            Side::Ask => {
                let mut base_amount: u64 = 0;

                for ask in &orderbook.asks {
                    if ask.order_id == order_id {
                        base_amount = ask.amount;
                    }
                }

                self.order_book.asks.retain(|bid: &LimitOrder| {
                    !(bid.order_id == order_id && bid.owner == self.trader.key())
                });

                let ctx_acc = TransferChecked {
                    mint: self.base_mint.to_account_info(),
                    from: self.base_mint_vault.to_account_info(),
                    to: self.trader_base_mint_account.to_account_info(),
                    authority: self.market.to_account_info(),
                };

                let ctx_refund = CpiContext::new(self.token_program.to_account_info(), ctx_acc)
                    .with_signer(signer_seeds);
                token_interface::transfer_checked(
                    ctx_refund,
                    base_amount,
                    self.base_mint.decimals,
                )?;
            }
        }
        Ok(())
    }
}
