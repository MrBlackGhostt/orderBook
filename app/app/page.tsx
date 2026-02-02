"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMarkets } from "@/hooks/useMarket";
import { RefreshCw, Plus, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { connected } = useWallet();
  const { markets, loading, error, refresh } = useMarkets();

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Markets</h1>
          <p className="text-gray-400 mt-1">
            Browse and trade on available markets
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/create"
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Market</span>
          </Link>
        </div>
      </div>

      {!connected && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-yellow-200">
          Connect your wallet to view and trade on markets
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {connected && markets.length === 0 && !loading && (
        <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
          <h2 className="text-xl text-gray-400 mb-4">No markets found</h2>
          <p className="text-gray-500 mb-6">
            Be the first to create a trading market!
          </p>
          <Link
            href="/create"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Create Market</span>
          </Link>
        </div>
      )}

      {connected && markets.length > 0 && (
        <div className="grid gap-4">
          <div className="grid grid-cols-5 gap-4 px-4 py-2 text-sm text-gray-500 border-b border-gray-800">
            <span>Market</span>
            <span>Base Token</span>
            <span>Quote Token</span>
            <span>Fee</span>
            <span></span>
          </div>
          {markets.map((market) => (
            <Link
              key={market.address}
              href={`/trade/${market.address}`}
              className="grid grid-cols-5 gap-4 px-4 py-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg border border-gray-800 items-center transition-colors"
            >
              <span className="font-mono text-sm text-purple-400">
                {shortenAddress(market.address)}
              </span>
              <span className="font-mono text-sm">
                {shortenAddress(market.baseMint)}
              </span>
              <span className="font-mono text-sm">
                {shortenAddress(market.quoteMint)}
              </span>
              <span className="text-sm">
                {(market.feeBps / 100).toFixed(2)}%
              </span>
              <div className="flex justify-end">
                <span className="flex items-center space-x-1 text-purple-400 text-sm">
                  <span>Trade</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      )}
    </div>
  );
}
