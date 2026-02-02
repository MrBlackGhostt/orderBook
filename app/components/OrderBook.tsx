"use client";

import { DisplayOrder } from "@/types";
import { RefreshCw } from "lucide-react";

interface OrderBookProps {
  bids: DisplayOrder[];
  asks: DisplayOrder[];
  loading: boolean;
  onRefresh: () => void;
}

export function OrderBook({ bids, asks, loading, onRefresh }: OrderBookProps) {
  const formatPrice = (price: number) => price.toFixed(4);
  const formatAmount = (amount: number) => amount.toFixed(4);

  // Get max amount for depth visualization
  const maxBidAmount = Math.max(...bids.map((b) => b.amount), 1);
  const maxAskAmount = Math.max(...asks.map((a) => a.amount), 1);

  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
        <h2 className="text-sm font-medium text-white">Order Book</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="px-4 py-2">
        {/* Header */}
        <div className="grid grid-cols-3 gap-2 text-[10px] font-medium text-zinc-600 uppercase tracking-wider pb-2">
          <span>Price</span>
          <span className="text-right">Size</span>
          <span className="text-right">Total</span>
        </div>

        {/* Asks (sells) - reversed so lowest price is at bottom */}
        <div className="max-h-40 overflow-y-auto">
          {asks.length === 0 ? (
            <div className="py-6 text-center text-zinc-600 text-xs">No asks</div>
          ) : (
            [...asks].reverse().map((order) => (
              <div
                key={order.orderId}
                className="grid grid-cols-3 gap-2 py-1 text-xs relative"
              >
                <div
                  className="absolute inset-0 bg-red-500/8 rounded-sm"
                  style={{
                    width: `${(order.amount / maxAskAmount) * 100}%`,
                    right: 0,
                    left: "auto",
                  }}
                />
                <span className="text-red-400 relative z-10 font-mono">
                  {formatPrice(order.price)}
                </span>
                <span className="text-right relative z-10 font-mono text-zinc-400">
                  {formatAmount(order.amount)}
                </span>
                <span className="text-right text-zinc-500 relative z-10 font-mono">
                  {formatPrice(order.price * order.amount)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Spread indicator */}
        <div className="py-2 my-1 border-y border-[#1e1e2e]">
          {bids.length > 0 && asks.length > 0 ? (
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-zinc-500">Spread:</span>
              <span className="text-zinc-300 font-mono">
                {((asks[0]?.price || 0) - (bids[0]?.price || 0)).toFixed(4)}
              </span>
            </div>
          ) : (
            <span className="text-zinc-600 text-xs block text-center">-</span>
          )}
        </div>

        {/* Bids (buys) */}
        <div className="max-h-40 overflow-y-auto">
          {bids.length === 0 ? (
            <div className="py-6 text-center text-zinc-600 text-xs">No bids</div>
          ) : (
            bids.map((order) => (
              <div
                key={order.orderId}
                className="grid grid-cols-3 gap-2 py-1 text-xs relative"
              >
                <div
                  className="absolute inset-0 bg-emerald-500/8 rounded-sm"
                  style={{
                    width: `${(order.amount / maxBidAmount) * 100}%`,
                    right: 0,
                    left: "auto",
                  }}
                />
                <span className="text-emerald-400 relative z-10 font-mono">
                  {formatPrice(order.price)}
                </span>
                <span className="text-right relative z-10 font-mono text-zinc-400">
                  {formatAmount(order.amount)}
                </span>
                <span className="text-right text-zinc-500 relative z-10 font-mono">
                  {formatPrice(order.price * order.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
