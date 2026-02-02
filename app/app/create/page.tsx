"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useProgram } from "@/hooks/useProgram";
import { getMarketPda, getOrderBookPda } from "@/lib/constants";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CreateMarketPage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { program } = useProgram();

  const [baseMint, setBaseMint] = useState("");
  const [quoteMint, setQuoteMint] = useState("");
  const [feeBps, setFeeBps] = useState("30"); // 0.3% default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const baseMintPubkey = new PublicKey(baseMint);
      const quoteMintPubkey = new PublicKey(quoteMint);
      const feeBpsNum = parseInt(feeBps);

      if (feeBpsNum < 0 || feeBpsNum > 10000) {
        throw new Error("Fee must be between 0 and 10000 bps (0-100%)");
      }

      const marketPda = getMarketPda(baseMintPubkey, quoteMintPubkey);
      const orderBookPda = getOrderBookPda(marketPda);

      // Get vault ATAs
      const baseVault = getAssociatedTokenAddressSync(
        baseMintPubkey,
        marketPda,
        true
      );
      const quoteVault = getAssociatedTokenAddressSync(
        quoteMintPubkey,
        marketPda,
        true
      );

      const tx = await (program.methods as any)
        .createMarket(feeBpsNum)
        .accountsPartial({
          marketSigner: publicKey,
          baseMint: baseMintPubkey,
          quoteMint: quoteMintPubkey,
          market: marketPda,
          orderBook: orderBookPda,
          baseMintVault: baseVault,
          quoteVault: quoteVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Market created:", tx);
      router.push(`/trade/${marketPda.toBase58()}`);
    } catch (err: any) {
      console.error("Error creating market:", err);
      setError(err.message || "Failed to create market");
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-xl mb-4">Connect Wallet</h2>
          <p className="text-gray-400">
            Please connect your wallet to create a market
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/"
        className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Markets</span>
      </Link>

      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Market</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Base Token Mint Address
            </label>
            <input
              type="text"
              value={baseMint}
              onChange={(e) => setBaseMint(e.target.value)}
              placeholder="Enter base token mint address"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The token being traded (e.g., SOL, RAY)
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Quote Token Mint Address
            </label>
            <input
              type="text"
              value={quoteMint}
              onChange={(e) => setQuoteMint(e.target.value)}
              placeholder="Enter quote token mint address"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The token used for pricing (e.g., USDC, USDT)
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Trading Fee (basis points)
            </label>
            <input
              type="number"
              value={feeBps}
              onChange={(e) => setFeeBps(e.target.value)}
              placeholder="30"
              min="0"
              max="10000"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              1 bps = 0.01%. Default 30 bps = 0.3%
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed rounded-lg font-medium flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Market</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
