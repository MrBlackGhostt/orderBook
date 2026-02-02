"use client";

import { useState, useEffect, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { MarketInfo } from "@/types";

export function useMarket(marketAddress: string | null) {
  const { program } = useProgram();
  const [market, setMarket] = useState<MarketInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarket = useCallback(async () => {
    if (!program || !marketAddress) {
      setMarket(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const marketPubkey = new PublicKey(marketAddress);
      const marketData = await (program.account as any).market.fetch(
        marketPubkey
      );

      setMarket({
        address: marketAddress,
        baseMint: marketData.baseMint.toBase58(),
        quoteMint: marketData.quoteMint.toBase58(),
        feeBps: marketData.feeBps,
        creator: marketData.creator.toBase58(),
      });
    } catch (err: any) {
      console.error("Error fetching market:", err);
      setError(err.message || "Failed to fetch market");
    } finally {
      setLoading(false);
    }
  }, [program, marketAddress]);

  useEffect(() => {
    fetchMarket();
  }, [fetchMarket]);

  return { market, loading, error, refresh: fetchMarket };
}

export function useMarkets() {
  const { program } = useProgram();
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    if (!program) {
      setMarkets([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allMarkets = await (program.account as any).market.all();

      const marketInfos: MarketInfo[] = allMarkets.map((m: any) => ({
        address: m.publicKey.toBase58(),
        baseMint: m.account.baseMint.toBase58(),
        quoteMint: m.account.quoteMint.toBase58(),
        feeBps: m.account.feeBps,
        creator: m.account.creator.toBase58(),
      }));

      setMarkets(marketInfos);
    } catch (err: any) {
      console.error("Error fetching markets:", err);
      setError(err.message || "Failed to fetch markets");
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return { markets, loading, error, refresh: fetchMarkets };
}
