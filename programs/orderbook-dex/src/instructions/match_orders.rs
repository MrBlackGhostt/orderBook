use std::cmp::min;

use crate::errors::OrderBookError;
use crate::{Market, OrderBook, Side};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::get_associated_token_address;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

#[derive(Accounts)]
pub struct MatchOrders<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    pub base_mint: InterfaceAccount<'info, Mint>,
    pub quote_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub base_mint_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub quote_mint_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub bidder_account: AccountInfo<'info>,

    #[account(mut)]
    pub asker_account: AccountInfo<'info>,

    // #[account(mut)]
    // pub bidder_base_ata: InterfaceAccount<'info, TokenAccount>,
    //
    #[account(mut)]
    pub asker_base_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub bidder_quote_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub asker_quote_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(mut ,seeds=[b"market", base_mint.key().as_ref(), quote_mint.key().as_ref()],bump
)]
    pub market: Account<'info, Market>,

    #[account(
    mut,
    address = get_associated_token_address(&bidder_account.key(), &base_mint.key())
        @ OrderBookError::InvalidAta
)]
    pub bidder_base_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(mut , seeds = [b"market_orderBook", market.key().as_ref()], bump)]
    pub order_book: Account<'info, OrderBook>,

    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> MatchOrders<'info> {
    pub fn match_orders(&mut self, bump: u8) -> Result<()> {
        self.order_book.bids.sort_by(|a, b| b.price.cmp(&a.price));
        self.order_book.asks.sort_by(|a, b| a.price.cmp(&b.price));

        let base_mint_key = self.base_mint.key();
        let quote_mint_key = self.quote_mint.key();
        let seeds = &[
            b"market",
            base_mint_key.as_ref(),
            quote_mint_key.as_ref(),
            &[bump],
        ];

        let signer_seeds = &[&seeds[..]];

        while !self.order_book.bids.is_empty() && !self.order_book.asks.is_empty() {
            let bid = &self.order_book.bids[0];
            let ask = &self.order_book.asks[0];

            if bid.price >= ask.price {
                let fill_amount = min(bid.amount, ask.amount);
                let execution_price = ask.price;
                let quote_amount = fill_amount * execution_price;

                //Calculate the fee
                let total_fee = (quote_amount * self.market.fee_bps as u64) / 10000;
                let bidder_fee = total_fee / 2;
                let asker_fee = total_fee / 2;

                //TokenTransfer from vault to asker
                let ctx_quote_acc = TransferChecked {
                    from: self.quote_mint_vault.to_account_info(),
                    to: self.asker_quote_ata.to_account_info(),
                    mint: self.quote_mint.to_account_info(),
                    authority: self.market.to_account_info(),
                };

                let ctx_quote =
                    CpiContext::new(self.token_program.to_account_info(), ctx_quote_acc)
                        .with_signer(signer_seeds);

                token_interface::transfer_checked(
                    ctx_quote,
                    quote_amount - asker_fee,
                    self.quote_mint.decimals,
                )?;

                let ctx_base_acc = TransferChecked {
                    from: self.base_mint_vault.to_account_info(),
                    to: self.bidder_base_ata.to_account_info(),
                    mint: self.base_mint.to_account_info(),
                    authority: self.market.to_account_info(),
                };

                let ctx_base = CpiContext::new(self.token_program.to_account_info(), ctx_base_acc)
                    .with_signer(signer_seeds);

                token_interface::transfer_checked(
                    ctx_base,
                    self.order_book.bids[0].amount - bidder_fee,
                    self.base_mint.decimals,
                )?;
            } else {
                break;
            }
        }

        Ok(())
    }
}
