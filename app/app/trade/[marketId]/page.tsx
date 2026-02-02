"use client";

import { use } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useMarket } from "@/hooks/useMarket";
import { useOrderBook } from "@/hooks/useOrderBook";
import { OrderBook } from "@/components/OrderBook";
import { TradePanel } from "@/components/TradePanel";
import { MyOrders } from "@/components/MyOrders";
import { CrankButton } from "@/components/CrankButton";
import { TokenBalances } from "@/components/TokenBalances";
import { NewUserBanner } from "@/components/NewUserBanner";
import { AirdropButton } from "@/components/AirdropButton";
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
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Markets</span>
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-300 text-sm">
          Error loading market: {marketError}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white">Trading</h1>
            {market && (
              <div className="flex items-center gap-2 text-zinc-500 text-xs mt-0.5">
                <span className="font-mono">
                  {shortenAddress(market.baseMint)}
                </span>
                <span className="text-zinc-600">/</span>
                <span className="font-mono">
                  {shortenAddress(market.quoteMint)}
                </span>
                <a
                  href={`https://solscan.io/account/${marketId}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Balances in Header - Compact View */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {market && connected && (
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2">
              <TokenBalances
                baseMint={new PublicKey(market.baseMint)}
                quoteMint={new PublicKey(market.quoteMint)}
                baseSymbol="BASE"
                quoteSymbol="QUOTE"
                compact={true}
              />
            </div>
          )}
          {market && (
            <div className="text-xs text-zinc-500">
              Fee: <span className="text-zinc-300">{(market.feeBps / 100).toFixed(2)}%</span>
            </div>
          )}
        </div>
      </div>

      {!connected && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3 text-amber-200/90 text-sm">
          Connect your wallet to trade
        </div>
      )}

      {connected && <NewUserBanner />}

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
        <div className="lg:col-span-1 space-y-4">
          {/* Airdrop Button - Shows when wallet connected */}
          {market && connected && (
            <AirdropButton
              baseMint={new PublicKey(market.baseMint)}
              quoteMint={new PublicKey(market.quoteMint)}
              onAirdropComplete={refresh}
            />
          )}
          
          <TradePanel
            market={market}
            onOrderPlaced={refresh}
            baseSymbol="BASE"
            quoteSymbol="QUOTE"
          />
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
