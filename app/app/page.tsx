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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Markets</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Browse and trade on available markets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-[#1e1e2e] hover:bg-[#27272f] border border-[#2a2a3a] rounded-lg text-sm text-zinc-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/create"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Market</span>
          </Link>
        </div>
      </div>

      {!connected && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3 text-amber-200/90 text-sm">
          Connect your wallet to view and trade on markets
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {connected && markets.length === 0 && !loading && (
        <div className="text-center py-20 bg-[#12121a] rounded-xl border border-[#1e1e2e]">
          <div className="w-12 h-12 rounded-full bg-[#1e1e2e] flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-zinc-500" />
          </div>
          <h2 className="text-lg text-zinc-300 mb-2">No markets found</h2>
          <p className="text-zinc-500 text-sm mb-6">
            Be the first to create a trading market
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Market</span>
          </Link>
        </div>
      )}

      {connected && markets.length > 0 && (
        <div className="bg-[#12121a] rounded-xl border border-[#1e1e2e] overflow-hidden">
          <div className="grid grid-cols-5 gap-4 px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-[#1e1e2e]">
            <span>Market</span>
            <span>Base Token</span>
            <span>Quote Token</span>
            <span>Fee</span>
            <span></span>
          </div>
          <div className="divide-y divide-[#1e1e2e]">
            {markets.map((market) => (
              <Link
                key={market.address}
                href={`/trade/${market.address}`}
                className="grid grid-cols-5 gap-4 px-4 py-3.5 hover:bg-white/[0.02] items-center transition-colors group"
              >
                <span className="font-mono text-sm text-blue-400">
                  {shortenAddress(market.address)}
                </span>
                <span className="font-mono text-sm text-zinc-400">
                  {shortenAddress(market.baseMint)}
                </span>
                <span className="font-mono text-sm text-zinc-400">
                  {shortenAddress(market.quoteMint)}
                </span>
                <span className="text-sm text-zinc-300">
                  {(market.feeBps / 100).toFixed(2)}%
                </span>
                <div className="flex justify-end">
                  <span className="flex items-center gap-1.5 text-zinc-500 group-hover:text-blue-400 text-sm transition-colors">
                    <span>Trade</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
}
