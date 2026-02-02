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
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1e1e2e]">
          <h2 className="text-sm font-medium text-white">My Orders</h2>
        </div>
        <div className="p-4">
          <p className="text-zinc-500 text-xs">Connect wallet to view orders</p>
        </div>
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
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e1e2e]">
        <h2 className="text-sm font-medium text-white">My Orders</h2>
      </div>

      <div className="p-4">
        {myOrders.length === 0 ? (
          <p className="text-zinc-500 text-xs">No open orders</p>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-5 gap-2 text-[10px] font-medium text-zinc-600 uppercase tracking-wider pb-2">
              <span>Side</span>
              <span>Price</span>
              <span>Amount</span>
              <span>ID</span>
              <span></span>
            </div>
            {myOrders.map((order) => (
              <div
                key={order.orderId}
                className="grid grid-cols-5 gap-2 items-center text-xs py-2 border-t border-[#1e1e2e]"
              >
                <span
                  className={`font-medium ${
                    order.side === "bid" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {order.side === "bid" ? "Buy" : "Sell"}
                </span>
                <span className="font-mono text-zinc-300">{order.price.toFixed(4)}</span>
                <span className="font-mono text-zinc-400">{order.amount.toFixed(4)}</span>
                <span className="text-zinc-600 font-mono text-[10px]">
                  #{order.orderId.slice(-4)}
                </span>
                <button
                  onClick={() => handleCancel(order)}
                  disabled={cancellingId === order.orderId}
                  className="p-1 hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-400 transition-colors justify-self-end"
                >
                  {cancellingId === order.orderId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
