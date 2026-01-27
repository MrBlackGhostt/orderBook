use anchor_lang::prelude::*;

#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq)]
pub enum Side {
    Buy,
    Sell,
}

#[account]
pub struct Market {
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub base_vault: Pubkey,
    pub quote_vault: Pubkey,
    pub fee_bps: u16,
    pub creator: Pubkey,
}
impl Market {
    pub const LEN: usize = 32 * 5 + 2;
}

#[account]
pub struct Order {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub side: Side,
    pub price: u64,
    pub amount: u64,
    pub filled: u64,
}
