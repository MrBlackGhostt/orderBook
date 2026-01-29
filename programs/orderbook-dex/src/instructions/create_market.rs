use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::states::*;

#[derive(Accounts)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub market_signer: Signer<'info>,

    #[account(mut)]
    pub base_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub quote_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = market_signer,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", base_mint.key().as_ref(), quote_mint.key().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(init_if_needed, payer=market_signer, space = 8 + OrderBook::INIT_SPACE , seeds = [b"market_orderBook", market.key().as_ref()], bump)]
    pub order_book: Account<'info, OrderBook>,
    // Vault which hold hte base_mint
    #[account(init_if_needed,payer= market_signer, associated_token::mint= base_mint, associated_token::authority = market,
    associated_token::token_program = token_program)]
    pub base_mint_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(init_if_needed,payer= market_signer, associated_token::mint= quote_mint, associated_token::authority = market,
    associated_token::token_program = token_program)]
    pub quote_vault: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateMarket<'info> {
    pub fn create_market(&mut self, fee_bps: u16) -> Result<()> {
        let markett = &mut self.market;
        markett.fee_bps = fee_bps;
        markett.base_mint = self.base_mint.key();
        markett.quote_mint = self.quote_mint.key();
        markett.creator = self.market_signer.key();
        markett.base_vault = self.base_mint_vault.key();
        markett.quote_vault = self.quote_vault.key();

        let order_book = &mut self.order_book;

        order_book.market = markett.key();

        Ok(())
    }
}
