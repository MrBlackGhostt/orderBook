use anchor_lang::prelude::*;
pub mod errors;
pub mod instructions;
pub mod states;
pub use errors::*;
pub use states::*;

pub use crate::instructions::*;
declare_id!("Gvv7atyen9oY1TccNVDb76btjUKwXi6bgmhQZDnaryGg");

#[program]
pub mod orderbook_dex {

    use super::*;

    pub fn create_market(ctx: Context<CreateMarket>, fee_bps: u16) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        ctx.accounts.create_market(fee_bps)?;
        Ok(())
    }

    pub fn place_order(
        ctx: Context<PlaceOrder>,
        price: u64,
        amount: u64,
        side: Side,
    ) -> Result<()> {
        msg!("Going to place_order; {:?}", ctx.program_id);
        ctx.accounts.place_order(price, amount, side)?;
        Ok(())
    }
    pub fn cancel_order(ctx: Context<CancelOrder>, side: Side, order_id: u64) -> Result<()> {
        let bump = ctx.bumps.market;
        ctx.accounts.cancel_order(side, order_id, bump)?;
        Ok(())
    }
}
