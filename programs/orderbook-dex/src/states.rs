use anchor_lang::prelude::*;

#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq, InitSpace)]
pub enum Side {
    Bid,
    Ask,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, InitSpace, Copy)]
pub struct LimitOrder {
    pub owner: Pubkey,
    pub price: u64,
    pub amount: u64,
    pub order_id: u64,
}

#[account]
#[derive(InitSpace)]
pub struct OrderBook {
    pub market: Pubkey,
    pub next_order_id: u64,
    #[max_len(50)]
    pub bids: Vec<LimitOrder>,
    #[max_len(50)]
    pub asks: Vec<LimitOrder>,
}

impl OrderBook {
    pub const MAX_ORDERS: usize = 50;
}

#[account]
#[derive(InitSpace)]
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
