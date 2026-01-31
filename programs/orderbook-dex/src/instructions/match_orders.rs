use std::cmp::min;

use crate::errors::OrderBookError;
use crate::{Market, OrderBook};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::get_associated_token_address;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

#[derive(Accounts)]
pub struct MatchOrders<'info> {
    #[account(mut)]
    pub cranker: Signer<'info>,

    pub base_mint: InterfaceAccount<'info, Mint>,
    pub quote_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub base_mint_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub quote_mint_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(mut ,seeds=[b"market", base_mint.key().as_ref(), quote_mint.key().as_ref()],bump
 )]
    pub market: Account<'info, Market>,

    #[account(mut , seeds = [b"market_orderBook", market.key().as_ref()], bump)]
    pub order_book: Account<'info, OrderBook>,

    #[account(mut)]
    pub fee_collector: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> MatchOrders<'info> {
    pub fn match_orders(
        &mut self,
        bump: u8,
        remaining_accounts: &'info [AccountInfo<'info>],
    ) -> Result<()> {
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

        let remaining = remaining_accounts;

        let signer_seeds = &[&seeds[..]];

        while !self.order_book.bids.is_empty() && !self.order_book.asks.is_empty() {
            let bid = &self.order_book.bids[0];
            let ask = &self.order_book.asks[0];

            msg!(
                "Checking match: bid.price={}, ask.price={}",
                bid.price,
                ask.price
            );
            msg!("Bid amount={}, Ask amount={}", bid.amount, ask.amount);

            if bid.price >= ask.price {
                let fill_amount = min(bid.amount, ask.amount);
                let execution_price = ask.price;
                let quote_amount = fill_amount * execution_price;

                //Calculate the fee
                let total_fee = (quote_amount * self.market.fee_bps as u64) / 10000;
                let asker_fee = total_fee / 2;

                let bidder_base_ata = find_ata(remaining, bid.owner, self.base_mint.key())?;
                let asker_quote_ata = find_ata(remaining, ask.owner, self.quote_mint.key())?;

                let cranker_quote_ata =
                    find_ata(remaining, self.cranker.key(), self.quote_mint.key())?;

                //TokenTransfer from vault to asker

                let ctx_quote_acc = TransferChecked {
                    from: self.quote_mint_vault.to_account_info(),
                    to: asker_quote_ata.to_account_info(),
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
                    to: bidder_base_ata.to_account_info(),
                    mint: self.base_mint.to_account_info(),
                    authority: self.market.to_account_info(),
                };

                let ctx_base = CpiContext::new(self.token_program.to_account_info(), ctx_base_acc)
                    .with_signer(signer_seeds);

                token_interface::transfer_checked(ctx_base, fill_amount, self.base_mint.decimals)?;

                self.order_book.bids[0].amount -= fill_amount;
                self.order_book.asks[0].amount -= fill_amount;

                if self.order_book.bids[0].amount == 0 {
                    self.order_book.bids.remove(0);
                }
                if self.order_book.asks[0].amount == 0 {
                    self.order_book.asks.remove(0);
                }

                let cranker_reward = total_fee / 10;
                let market_fee = total_fee - cranker_reward;

                let ctx_cranker = TransferChecked {
                    from: self.quote_mint_vault.to_account_info(),
                    to: cranker_quote_ata.to_account_info(),
                    mint: self.quote_mint.to_account_info(),
                    authority: self.market.to_account_info(),
                };

                let ctx_cranker_transfer =
                    CpiContext::new(self.token_program.to_account_info(), ctx_cranker)
                        .with_signer(signer_seeds);

                token_interface::transfer_checked(
                    ctx_cranker_transfer,
                    cranker_reward,
                    self.quote_mint.decimals,
                )?;

                let ctx_fee = TransferChecked {
                    from: self.quote_mint_vault.to_account_info(),
                    to: self.fee_collector.to_account_info(),
                    mint: self.quote_mint.to_account_info(),
                    authority: self.market.to_account_info(),
                };

                let ctx_fee_transfer =
                    CpiContext::new(self.token_program.to_account_info(), ctx_fee)
                        .with_signer(signer_seeds);

                token_interface::transfer_checked(
                    ctx_fee_transfer,
                    market_fee,
                    self.quote_mint.decimals,
                )?;

                msg!(
                    "After match - Bid amount={}, Ask amount={}",
                    self.order_book.bids[0].amount,
                    self.order_book.asks[0].amount
                );
                msg!(
                    "Bids count={}, Asks count={}",
                    self.order_book.bids.len(),
                    self.order_book.asks.len()
                );
            } else {
                break;
            }
        }

        Ok(())
    }
}

fn find_ata<'info>(
    accounts: &'info [AccountInfo<'info>],
    owner: Pubkey,
    mint: Pubkey,
) -> Result<InterfaceAccount<'info, TokenAccount>> {
    let expected_ata = get_associated_token_address(&owner, &mint);

    for account in accounts {
        if account.key() == expected_ata {
            return InterfaceAccount::try_from(account);
        }
    }

    err!(OrderBookError::AtaNotFound)
}
