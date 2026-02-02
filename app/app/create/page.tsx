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
import { createTokenPair, checkSolBalance } from "@/lib/tokenCreation";
import { ArrowLeft, Loader2, Check, AlertCircle, Coins, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function CreateMarketPage() {
  const router = useRouter();
  const wallet = useWallet();
  const { publicKey, connected, signTransaction } = wallet;
  const { connection } = useConnection();
  const { program } = useProgram();

  const [baseMint, setBaseMint] = useState("");
  const [quoteMint, setQuoteMint] = useState("");
  const [feeBps, setFeeBps] = useState("30"); // 0.3% default
  const [loading, setLoading] = useState(false);
  const [creatingTokens, setCreatingTokens] = useState(false);
  const [tokensCreated, setTokensCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTokens = async () => {
    if (!publicKey || !signTransaction) return;

    setCreatingTokens(true);
    setError(null);

    try {
      // Check SOL balance first
      const { hasEnough, balance } = await checkSolBalance(connection, publicKey);
      
      if (!hasEnough) {
        throw new Error(
          `Insufficient SOL balance. You have ${balance.toFixed(4)} SOL, but need at least 0.01 SOL. Run: solana airdrop 2`
        );
      }

      // Create both tokens
      const { baseMint: baseToken, quoteMint: quoteToken } = await createTokenPair(
        connection,
        publicKey,
        signTransaction,
        9, // BASE decimals
        6  // QUOTE decimals
      );

      // Auto-fill the form
      setBaseMint(baseToken.toBase58());
      setQuoteMint(quoteToken.toBase58());
      setTokensCreated(true);
    } catch (err: any) {
      console.error("Error creating tokens:", err);
      setError(err.message || "Failed to create tokens");
    } finally {
      setCreatingTokens(false);
    }
  };

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto">
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
    <div className="max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Markets</span>
      </Link>

      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">Create New Market</h1>
        <p className="text-gray-400 text-sm mb-6">
          Create a permissionless order book market for any token pair
        </p>

        {/* Step 1: Create Tokens */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              tokensCreated ? "bg-green-600" : "bg-purple-600"
            }`}>
              {tokensCreated ? <Check className="w-5 h-5" /> : "1"}
            </div>
            <h2 className="text-lg font-semibold">Create Trading Tokens</h2>
          </div>

          <div className="ml-11 mb-4">
            {!tokensCreated ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-3">
                  We'll create two test tokens for you:
                </p>
                <ul className="text-sm text-gray-400 space-y-1 mb-4">
                  <li>• <span className="text-white">BASE token</span> (9 decimals) - The asset being traded</li>
                  <li>• <span className="text-white">QUOTE token</span> (6 decimals) - The pricing currency</li>
                  <li>• <span className="text-purple-400">You'll be the mint authority</span> (can mint unlimited tokens)</li>
                </ul>
                
                <button
                  onClick={handleCreateTokens}
                  disabled={creatingTokens}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  {creatingTokens ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Tokens...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-5 h-5" />
                      <span>Create Token Pair</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-2">
                  ℹ️ Requires ~0.01 SOL for transaction fees
                </p>
              </div>
            ) : (
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-300 font-medium mb-2">Tokens created successfully!</p>
                    
                    <div className="space-y-2">
                      <div className="bg-gray-900/50 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">BASE Token (9 decimals)</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(baseMint)}
                              className="text-gray-400 hover:text-white p-1"
                              title="Copy address"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={`https://solscan.io/token/${baseMint}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-white p-1"
                              title="View on Solscan"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        <p className="text-xs font-mono text-purple-400 break-all">{baseMint}</p>
                      </div>

                      <div className="bg-gray-900/50 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">QUOTE Token (6 decimals)</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(quoteMint)}
                              className="text-gray-400 hover:text-white p-1"
                              title="Copy address"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={`https://solscan.io/token/${quoteMint}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-white p-1"
                              title="View on Solscan"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        <p className="text-xs font-mono text-purple-400 break-all">{quoteMint}</p>
                      </div>
                    </div>

                    <p className="text-xs text-green-400 mt-2">
                      ✓ You are the mint authority for both tokens
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Create Market */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              tokensCreated ? "bg-purple-600" : "bg-gray-700"
            }`}>
              2
            </div>
            <h2 className="text-lg font-semibold">Create Market</h2>
          </div>

          <form onSubmit={handleSubmit} className="ml-11 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Base Token Mint {tokensCreated && <span className="text-green-400">✓ Auto-filled</span>}
              </label>
              <input
                type="text"
                value={baseMint}
                onChange={(e) => setBaseMint(e.target.value)}
                placeholder="Create tokens first or paste existing mint address"
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:border-purple-500 ${
                  tokensCreated ? "border-green-700" : "border-gray-700"
                }`}
                disabled={!tokensCreated}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Quote Token Mint {tokensCreated && <span className="text-green-400">✓ Auto-filled</span>}
              </label>
              <input
                type="text"
                value={quoteMint}
                onChange={(e) => setQuoteMint(e.target.value)}
                placeholder="Create tokens first or paste existing mint address"
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:border-purple-500 ${
                  tokensCreated ? "border-green-700" : "border-gray-700"
                }`}
                disabled={!tokensCreated}
                required
              />
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
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !tokensCreated}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Market...</span>
                </>
              ) : (
                <span>Create Market</span>
              )}
            </button>

            {!tokensCreated && (
              <p className="text-xs text-gray-500 text-center">
                Create tokens first to enable market creation
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
