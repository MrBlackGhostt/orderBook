"use client";

import BN from "bn.js";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useProgram } from "@/hooks/useProgram";
import { getOrderBookPda } from "@/lib/constants";
import { DisplayOrder, MarketInfo } from "@/types";
import { Loader2, X } from "lucide-react";

interface MyOrdersProps {
  market: MarketInfo | null;
  bids: DisplayOrder[];
  asks: DisplayOrder[];
  onOrderCancelled: () => void;
}

export function MyOrders({
  market,
  bids,
  asks,
  onOrderCancelled,
}: MyOrdersProps) {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (!publicKey) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">My Orders</h2>
        <p className="text-gray-400 text-sm">Connect wallet to view orders</p>
      </div>
    );
  }

  // Filter orders belonging to current wallet
  const myBids = bids.filter((o) => o.owner === publicKey.toBase58());
  const myAsks = asks.filter((o) => o.owner === publicKey.toBase58());
  const myOrders = [...myBids, ...myAsks];

  const handleCancel = async (order: DisplayOrder) => {
    if (!program || !market) return;

    setCancellingId(order.orderId);

    try {
      const baseMint = new PublicKey(market.baseMint);
      const quoteMint = new PublicKey(market.quoteMint);
      const marketPda = new PublicKey(market.address);
      const orderBookPda = getOrderBookPda(marketPda);

      const baseVault = getAssociatedTokenAddressSync(
        baseMint,
        marketPda,
        true
      );
      const quoteVault = getAssociatedTokenAddressSync(
        quoteMint,
        marketPda,
        true
      );

      const traderBaseAta = getAssociatedTokenAddressSync(baseMint, publicKey);
      const traderQuoteAta = getAssociatedTokenAddressSync(
        quoteMint,
        publicKey
      );

      const sideArg = order.side === "bid" ? { bid: {} } : { ask: {} };

      await (program.methods as any)
        .cancelOrder(sideArg, new BN(order.orderId))
        .accountsPartial({
          trader: publicKey,
          market: marketPda,
          baseMint: baseMint,
          quoteMint: quoteMint,
          orderBook: orderBookPda,
          baseMintVault: baseVault,
          quoteMintVault: quoteVault,
          traderBaseMintAccount: traderBaseAta,
          traderQuoteMintAccount: traderQuoteAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      onOrderCancelled();
    } catch (err: any) {
      console.error("Error cancelling order:", err);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">My Orders</h2>

      {myOrders.length === 0 ? (
        <p className="text-gray-400 text-sm">No open orders</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 pb-2 border-b border-gray-800">
            <span>Side</span>
            <span>Price</span>
            <span>Amount</span>
            <span>ID</span>
            <span></span>
          </div>
          {myOrders.map((order) => (
            <div
              key={order.orderId}
              className="grid grid-cols-5 gap-2 items-center text-sm py-2"
            >
              <span
                className={
                  order.side === "bid" ? "text-green-400" : "text-red-400"
                }
              >
                {order.side === "bid" ? "Buy" : "Sell"}
              </span>
              <span>{order.price.toFixed(4)}</span>
              <span>{order.amount.toFixed(4)}</span>
              <span className="text-gray-500 font-mono text-xs">
                #{order.orderId.slice(-4)}
              </span>
              <button
                onClick={() => handleCancel(order)}
                disabled={cancellingId === order.orderId}
                className="p-1 hover:bg-red-900/30 rounded text-red-400"
              >
                {cancellingId === order.orderId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
