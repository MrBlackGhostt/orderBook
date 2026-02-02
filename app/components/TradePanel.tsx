"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import { useProgram } from "@/hooks/useProgram";
import {
  getOrderBookPda,
  toRawAmount,
  BASE_DECIMALS,
  QUOTE_DECIMALS,
} from "@/lib/constants";
import { MarketInfo } from "@/types";
import { Loader2 } from "lucide-react";

interface TradePanelProps {
  market: MarketInfo | null;
  onOrderPlaced: () => void;
}

export function TradePanel({ market, onOrderPlaced }: TradePanelProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { program } = useProgram();

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to ensure ATA exists
  const ensureAta = async (
    mint: PublicKey,
    owner: PublicKey
  ): Promise<PublicKey> => {
    const ata = getAssociatedTokenAddressSync(mint, owner);

    try {
      await getAccount(connection, ata);
      // ATA exists
      return ata;
    } catch {
      // ATA doesn't exist, create it
      console.log(`Creating ATA for mint ${mint.toBase58()}`);
      const tx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          owner, // payer
          ata, // ata address
          owner, // owner
          mint // mint
        )
      );
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      console.log(`ATA created: ${ata.toBase58()}`);
      return ata;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !publicKey || !market) return;

    setLoading(true);
    setError(null);

    try {
      const priceNum = parseFloat(price);
      const amountNum = parseFloat(amount);

      if (priceNum <= 0 || amountNum <= 0) {
        throw new Error("Price and amount must be positive");
      }

      const baseMint = new PublicKey(market.baseMint);
      const quoteMint = new PublicKey(market.quoteMint);
      const marketPda = new PublicKey(market.address);
      const orderBookPda = getOrderBookPda(marketPda);

      // Get vaults
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

      // Ensure trader ATAs exist (creates if needed)
      const traderBaseAta = await ensureAta(baseMint, publicKey);
      const traderQuoteAta = await ensureAta(quoteMint, publicKey);

      // Convert to raw amounts
      const rawPrice = toRawAmount(priceNum, QUOTE_DECIMALS);
      const rawAmount = toRawAmount(amountNum, BASE_DECIMALS);

      const sideArg = side === "buy" ? { bid: {} } : { ask: {} };

      const tx = await (program.methods as any)
        .placeOrder(rawPrice, rawAmount, sideArg)
        .accountsPartial({
          trader: publicKey,
          market: marketPda,
          baseMint: baseMint,
          quoteMint: quoteMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          baseMintVault: baseVault,
          quoteMintVault: quoteVault,
          traderBaseMintAccount: traderBaseAta,
          traderQuoteMintAccount: traderQuoteAta,
          orderBook: orderBookPda,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("Order placed:", tx);
      setPrice("");
      setAmount("");
      onOrderPlaced();
    } catch (err: any) {
      console.error("Error placing order:", err);
      setError(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (!market) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <p className="text-gray-400 text-center">Loading market...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Place Order</h2>

      {/* Buy/Sell Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setSide("buy")}
          className={`py-2 rounded-lg font-medium transition-colors ${
            side === "buy"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`py-2 rounded-lg font-medium transition-colors ${
            side === "sell"
              ? "bg-red-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Price</label>
          <input
            type="number"
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Amount</label>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
            required
          />
        </div>

        {price && amount && (
          <div className="text-sm text-gray-400">
            Total: {(parseFloat(price) * parseFloat(amount) || 0).toFixed(4)}
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm bg-red-900/30 rounded p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !publicKey}
          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2 ${
            side === "buy"
              ? "bg-green-600 hover:bg-green-700 disabled:bg-green-800"
              : "bg-red-600 hover:bg-red-700 disabled:bg-red-800"
          } disabled:cursor-not-allowed`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Placing Order...</span>
            </>
          ) : (
            <span>{side === "buy" ? "Buy" : "Sell"}</span>
          )}
        </button>
      </form>
    </div>
  );
}
