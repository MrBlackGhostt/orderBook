use anchor_lang::prelude::*;

#[error_code]
pub enum OrderBookError {
    #[msg("OrderBook is full")]
    OrderBookFull,
    #[msg("Error in calulting the Bid Amount")]
    ErrorInMultiply,
}
