use anchor_lang::prelude::*;
pub mod instructions;
pub mod states;
pub use states::*;

pub use crate::instructions::*;
declare_id!("Gvv7atyen9oY1TccNVDb76btjUKwXi6bgmhQZDnaryGg");

#[program]
pub mod orderbook_dex {
    use super::*;

    pub fn initialize(ctx: Context<CreateMarket>, fee_bps: u16) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        ctx.accounts.create_market(fee_bps)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
