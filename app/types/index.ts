import { PublicKey } from "@solana/web3.js";

export interface LimitOrder {
  owner: PublicKey;
  price: bigint;
  amount: bigint;
  orderId: bigint;
}

export interface Market {
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseVault: PublicKey;
  quoteVault: PublicKey;
  feeBps: number;
  creator: PublicKey;
}

export interface OrderBook {
  market: PublicKey;
  nextOrderId: bigint;
  bids: LimitOrder[];
  asks: LimitOrder[];
}

export type Side = "bid" | "ask";

// For display purposes
export interface DisplayOrder {
  owner: string;
  price: number;
  amount: number;
  orderId: string;
  side: Side;
}

export interface MarketInfo {
  address: string;
  baseMint: string;
  quoteMint: string;
  feeBps: number;
  creator: string;
  baseSymbol?: string;
  quoteSymbol?: string;
}
