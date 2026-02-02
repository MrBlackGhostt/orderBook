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
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
        <Zap className="w-5 h-5 text-yellow-400" />
        <span>Crank (Match Orders)</span>
      </h2>

      <p className="text-gray-400 text-sm mb-4">
        Anyone can match orders and earn 10% of trading fees!
      </p>

      {canMatch && (
        <div className="bg-green-900/30 border border-green-700 rounded p-2 mb-4 text-green-200 text-sm">
          Matchable orders detected! Best bid: {bids[0]?.price.toFixed(4)}, Best
          ask: {asks[0]?.price.toFixed(4)}
        </div>
      )}

      <button
        onClick={handleCrank}
        disabled={loading || !publicKey || !canMatch}
        className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Matching...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>Match Orders</span>
          </>
        )}
      </button>

      {result && (
        <p
          className={`mt-2 text-sm ${
            result.includes("success") ? "text-green-400" : "text-red-400"
          }`}
        >
          {result}
        </p>
      )}

      {!canMatch && bids.length > 0 && asks.length > 0 && (
        <p className="mt-2 text-gray-500 text-sm">
          No matchable orders (bid must be {">"}= ask)
        </p>
      )}
    </div>
  );
}
