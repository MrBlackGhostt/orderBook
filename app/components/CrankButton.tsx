"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useProgram } from "@/hooks/useProgram";
import { getOrderBookPda } from "@/lib/constants";
import { MarketInfo, DisplayOrder } from "@/types";
import { Loader2, Zap } from "lucide-react";

interface CrankButtonProps {
  market: MarketInfo | null;
  bids: DisplayOrder[];
  asks: DisplayOrder[];
  onMatched: () => void;
}

export function CrankButton({
  market,
  bids,
  asks,
  onMatched,
}: CrankButtonProps) {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Check if there are matchable orders
  const canMatch =
    bids.length > 0 && asks.length > 0 && bids[0].price >= asks[0].price;

  const handleCrank = async () => {
    if (!program || !publicKey || !market) return;

    setLoading(true);
    setResult(null);

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

      // Fee collector is market creator's quote token ATA
      const marketCreator = new PublicKey(market.creator);
      const feeCollector = getAssociatedTokenAddressSync(
        quoteMint,
        marketCreator
      );

      // Build remaining accounts for all traders in matchable orders
      const remainingAccounts: {
        pubkey: PublicKey;
        isSigner: boolean;
        isWritable: boolean;
      }[] = [];

      // For each matchable bid, add bidder's base ATA
      for (const bid of bids) {
        const bidder = new PublicKey(bid.owner);
        const bidderBaseAta = getAssociatedTokenAddressSync(baseMint, bidder);
        remainingAccounts.push({
          pubkey: bidderBaseAta,
          isSigner: false,
          isWritable: true,
        });
      }

      // For each matchable ask, add asker's quote ATA
      for (const ask of asks) {
        const asker = new PublicKey(ask.owner);
        const askerQuoteAta = getAssociatedTokenAddressSync(quoteMint, asker);
        remainingAccounts.push({
          pubkey: askerQuoteAta,
          isSigner: false,
          isWritable: true,
        });
      }

      // Add cranker's quote ATA for fee
      const crankerQuoteAta = getAssociatedTokenAddressSync(
        quoteMint,
        publicKey
      );
      remainingAccounts.push({
        pubkey: crankerQuoteAta,
        isSigner: false,
        isWritable: true,
      });

      const tx = await (program.methods as any)
        .matchOrder()
        .accountsPartial({
          cranker: publicKey,
          baseMint: baseMint,
          quoteMint: quoteMint,
          baseMintVault: baseVault,
          quoteMintVault: quoteVault,
          market: marketPda,
          orderBook: orderBookPda,
          feeCollector: feeCollector,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .rpc();

      console.log("Orders matched:", tx);
      setResult("Orders matched successfully!");
      onMatched();
    } catch (err: any) {
      console.error("Error matching orders:", err);
      setResult(err.message || "Failed to match orders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-medium text-white">Match Orders</h2>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-zinc-500 text-xs">
          Anyone can match orders and earn 10% of trading fees
        </p>

        {canMatch && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-xs">
            <span className="text-emerald-300">Matchable orders found</span>
            <div className="flex gap-3 mt-1 text-emerald-400/80">
              <span>Bid: {bids[0]?.price.toFixed(4)}</span>
              <span>Ask: {asks[0]?.price.toFixed(4)}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleCrank}
          disabled={loading || !publicKey || !canMatch}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-[#1e1e2e] disabled:text-zinc-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-black transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Matching...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Match Orders</span>
            </>
          )}
        </button>

        {result && (
          <p
            className={`text-xs ${
              result.includes("success") ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {result}
          </p>
        )}

        {!canMatch && bids.length > 0 && asks.length > 0 && (
          <p className="text-zinc-600 text-xs">
            No matchable orders (bid must be {">"}= ask)
          </p>
        )}
      </div>
    </div>
  );
}
