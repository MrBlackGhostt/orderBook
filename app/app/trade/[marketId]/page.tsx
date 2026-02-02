"use client";

import { use } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMarket } from "@/hooks/useMarket";
import { useOrderBook } from "@/hooks/useOrderBook";
import { OrderBook } from "@/components/OrderBook";
import { TradePanel } from "@/components/TradePanel";
import { MyOrders } from "@/components/MyOrders";
import { CrankButton } from "@/components/CrankButton";
import { ArrowLeft, ExternalLink } from "lucide-react";

interface TradingPageProps {
  params: Promise<{ marketId: string }>;
}

export default function TradingPage({ params }: TradingPageProps) {
  const { marketId } = use(params);
  const { connected } = useWallet();
  const {
    market,
    loading: marketLoading,
    error: marketError,
  } = useMarket(marketId);
  const {
    bids,
    asks,
    loading: orderbookLoading,
    refresh,
  } = useOrderBook(marketId);

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (marketError) {
    return (
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Markets</span>
        </Link>
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-200">
          Error loading market: {marketError}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Trading</h1>
            {market && (
              <div className="flex items-center space-x-2 text-gray-400 text-sm mt-1">
                <span className="font-mono">
                  {shortenAddress(market.baseMint)}
                </span>
                <span>/</span>
                <span className="font-mono">
                  {shortenAddress(market.quoteMint)}
                </span>
                <a
                  href={`https://solscan.io/account/${marketId}?cluster=custom&customUrl=http://localhost:8899`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>
        {market && (
          <div className="text-right">
            <p className="text-gray-400 text-sm">
              Fee: {(market.feeBps / 100).toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      {!connected && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-yellow-200">
          Connect your wallet to trade
        </div>
      )}

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Book */}
        <div className="lg:col-span-1">
          <OrderBook
            bids={bids}
            asks={asks}
            loading={orderbookLoading}
            onRefresh={refresh}
          />
        </div>

        {/* Middle: Trade Panel */}
        <div className="lg:col-span-1 space-y-6">
          <TradePanel market={market} onOrderPlaced={refresh} />
          <CrankButton
            market={market}
            bids={bids}
            asks={asks}
            onMatched={refresh}
          />
        </div>

        {/* Right: My Orders */}
        <div className="lg:col-span-1">
          <MyOrders
            market={market}
            bids={bids}
            asks={asks}
            onOrderCancelled={refresh}
          />
        </div>
      </div>
    </div>
  );
}
