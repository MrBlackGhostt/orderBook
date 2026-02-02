"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import {
  getOrderBookPda,
  fromRawAmount,
  BASE_DECIMALS,
  QUOTE_DECIMALS,
} from "@/lib/constants";
import { DisplayOrder } from "@/types";

interface UseOrderBookResult {
  bids: DisplayOrder[];
  asks: DisplayOrder[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOrderBook(marketAddress: string | null): UseOrderBookResult {
  const { connection } = useConnection();
  const { program } = useProgram();
  const [bids, setBids] = useState<DisplayOrder[]>([]);
  const [asks, setAsks] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderBook = useCallback(async () => {
    if (!program || !marketAddress) {
      setBids([]);
      setAsks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const marketPubkey = new PublicKey(marketAddress);
      const orderBookPda = getOrderBookPda(marketPubkey);

      const orderBook = await (program.account as any).orderBook.fetch(
        orderBookPda
      );

      // Convert raw orders to display format
      const displayBids: DisplayOrder[] = orderBook.bids.map((order: any) => ({
        owner: order.owner.toBase58(),
        price: fromRawAmount(BigInt(order.price.toString()), QUOTE_DECIMALS),
        amount: fromRawAmount(BigInt(order.amount.toString()), BASE_DECIMALS),
        orderId: order.orderId.toString(),
        side: "bid" as const,
      }));

      const displayAsks: DisplayOrder[] = orderBook.asks.map((order: any) => ({
        owner: order.owner.toBase58(),
        price: fromRawAmount(BigInt(order.price.toString()), QUOTE_DECIMALS),
        amount: fromRawAmount(BigInt(order.amount.toString()), BASE_DECIMALS),
        orderId: order.orderId.toString(),
        side: "ask" as const,
      }));

      // Sort: bids descending, asks ascending
      displayBids.sort((a, b) => b.price - a.price);
      displayAsks.sort((a, b) => a.price - b.price);

      setBids(displayBids);
      setAsks(displayAsks);
    } catch (err: any) {
      console.error("Error fetching orderbook:", err);
      setError(err.message || "Failed to fetch orderbook");
    } finally {
      setLoading(false);
    }
  }, [program, marketAddress]);

  // Initial fetch
  useEffect(() => {
    fetchOrderBook();
  }, [fetchOrderBook]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (!marketAddress) return;

    const interval = setInterval(fetchOrderBook, 3000);
    return () => clearInterval(interval);
  }, [fetchOrderBook, marketAddress]);

  return { bids, asks, loading, error, refresh: fetchOrderBook };
}
