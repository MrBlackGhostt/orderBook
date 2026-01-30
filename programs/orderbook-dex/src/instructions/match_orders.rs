use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{Market, OrderBook};

#[derive(Accounts)]
pub struct MatchOrders<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    pub base_mint: InterfaceAccount<'info, Mint>,
    pub quote_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub base_mint_valut: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub quote_mint_valut: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub bidder_account: AccountInfo<'info>,

    #[account(mut)]
    pub asker_account: AccountInfo<'info>,

    #[account(mut)]
    pub bidder_base_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub asker_quote_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(mut ,seeds=[b"market", base_mint.key().as_ref(), quote_mint.key().as_ref()],bump
)]
    pub market: Account<'info, Market>,

    #[account(mut , seeds = [b"market_orderBook", market.key().as_ref()], bump)]
    pub order_book: Account<'info, OrderBook>,

    pub token_program: Interface<'info, TokenInterface>,
}
