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
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Order Book</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 hover:bg-gray-800 rounded"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 pb-2 border-b border-gray-800">
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (sells) - reversed so lowest price is at bottom */}
      <div className="max-h-48 overflow-y-auto">
        {asks.length === 0 ? (
          <div className="py-4 text-center text-gray-500 text-sm">No asks</div>
        ) : (
          [...asks].reverse().map((order, i) => (
            <div
              key={order.orderId}
              className="grid grid-cols-3 gap-2 py-1 text-sm relative"
            >
              <div
                className="absolute inset-0 bg-red-500/10"
                style={{
                  width: `${(order.amount / maxAskAmount) * 100}%`,
                  right: 0,
                  left: "auto",
                }}
              />
              <span className="text-red-400 relative z-10">
                {formatPrice(order.price)}
              </span>
              <span className="text-right relative z-10">
                {formatAmount(order.amount)}
              </span>
              <span className="text-right text-gray-400 relative z-10">
                {formatPrice(order.price * order.amount)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Spread indicator */}
      <div className="py-2 text-center border-y border-gray-800 my-2">
        {bids.length > 0 && asks.length > 0 ? (
          <span className="text-gray-400 text-sm">
            Spread: {((asks[0]?.price || 0) - (bids[0]?.price || 0)).toFixed(4)}
          </span>
        ) : (
          <span className="text-gray-500 text-sm">-</span>
        )}
      </div>

      {/* Bids (buys) */}
      <div className="max-h-48 overflow-y-auto">
        {bids.length === 0 ? (
          <div className="py-4 text-center text-gray-500 text-sm">No bids</div>
        ) : (
          bids.map((order, i) => (
            <div
              key={order.orderId}
              className="grid grid-cols-3 gap-2 py-1 text-sm relative"
            >
              <div
                className="absolute inset-0 bg-green-500/10"
                style={{
                  width: `${(order.amount / maxBidAmount) * 100}%`,
                  right: 0,
                  left: "auto",
                }}
              />
              <span className="text-green-400 relative z-10">
                {formatPrice(order.price)}
              </span>
              <span className="text-right relative z-10">
                {formatAmount(order.amount)}
              </span>
              <span className="text-right text-gray-400 relative z-10">
                {formatPrice(order.price * order.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
