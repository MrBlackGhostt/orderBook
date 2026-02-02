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
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-8 text-center">
          <h2 className="text-lg font-medium text-white mb-2">Connect Wallet</h2>
          <p className="text-zinc-500 text-sm">
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
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-5 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Markets</span>
      </Link>

      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6">
        <h1 className="text-xl font-semibold text-white mb-1">Create New Market</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Create a permissionless order book market for any token pair
        </p>

        {/* Step 1: Create Tokens */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
              tokensCreated ? "bg-emerald-600" : "bg-blue-600"
            }`}>
              {tokensCreated ? <Check className="w-4 h-4" /> : "1"}
            </div>
            <h2 className="text-sm font-medium text-white">Create Trading Tokens</h2>
          </div>

          <div className="ml-10 mb-4">
            {!tokensCreated ? (
              <div className="bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg p-4">
                <p className="text-xs text-zinc-400 mb-3">
                  We will create two test tokens for you:
                </p>
                <ul className="text-xs text-zinc-500 space-y-1 mb-4">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                    <span className="text-zinc-300">BASE token</span> (9 decimals) - Asset being traded
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                    <span className="text-zinc-300">QUOTE token</span> (6 decimals) - Pricing currency
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                    <span className="text-blue-400">You will be the mint authority</span>
                  </li>
                </ul>
                
                <button
                  onClick={handleCreateTokens}
                  disabled={creatingTokens}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors text-white"
                >
                  {creatingTokens ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Tokens...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      <span>Create Token Pair</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-zinc-600 mt-2">
                  Requires ~0.01 SOL for transaction fees
                </p>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-emerald-300 text-sm font-medium mb-3">Tokens created successfully</p>
                    
                    <div className="space-y-2">
                      <div className="bg-[#0a0a0f] rounded-lg p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-zinc-500">BASE Token (9 decimals)</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copyToClipboard(baseMint)}
                              className="text-zinc-500 hover:text-white p-1 transition-colors"
                              title="Copy address"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={`https://solscan.io/token/${baseMint}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-white p-1 transition-colors"
                              title="View on Solscan"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        <p className="text-[10px] font-mono text-blue-400 break-all">{baseMint}</p>
                      </div>

                      <div className="bg-[#0a0a0f] rounded-lg p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-zinc-500">QUOTE Token (6 decimals)</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copyToClipboard(quoteMint)}
                              className="text-zinc-500 hover:text-white p-1 transition-colors"
                              title="Copy address"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={`https://solscan.io/token/${quoteMint}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-white p-1 transition-colors"
                              title="View on Solscan"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        <p className="text-[10px] font-mono text-blue-400 break-all">{quoteMint}</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-emerald-400 mt-2">
                      You are the mint authority for both tokens
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Create Market */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
              tokensCreated ? "bg-blue-600" : "bg-[#1e1e2e] text-zinc-500"
            }`}>
              2
            </div>
            <h2 className="text-sm font-medium text-white">Create Market</h2>
          </div>

          <form onSubmit={handleSubmit} className="ml-10 space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                Base Token Mint {tokensCreated && <span className="text-emerald-400">Auto-filled</span>}
              </label>
              <input
                type="text"
                value={baseMint}
                onChange={(e) => setBaseMint(e.target.value)}
                placeholder="Create tokens first or paste existing mint address"
                className={`w-full px-3 py-2.5 bg-[#0a0a0f] border rounded-lg text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors ${
                  tokensCreated ? "border-emerald-500/30" : "border-[#2a2a3a]"
                }`}
                disabled={!tokensCreated}
                required
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                Quote Token Mint {tokensCreated && <span className="text-emerald-400">Auto-filled</span>}
              </label>
              <input
                type="text"
                value={quoteMint}
                onChange={(e) => setQuoteMint(e.target.value)}
                placeholder="Create tokens first or paste existing mint address"
                className={`w-full px-3 py-2.5 bg-[#0a0a0f] border rounded-lg text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors ${
                  tokensCreated ? "border-emerald-500/30" : "border-[#2a2a3a]"
                }`}
                disabled={!tokensCreated}
                required
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                Trading Fee (basis points)
              </label>
              <input
                type="number"
                value={feeBps}
                onChange={(e) => setFeeBps(e.target.value)}
                placeholder="30"
                min="0"
                max="10000"
                className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                required
              />
              <p className="text-[10px] text-zinc-600 mt-1">
                1 bps = 0.01%. Default 30 bps = 0.3%
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !tokensCreated}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-[#1e1e2e] disabled:text-zinc-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Market...</span>
                </>
              ) : (
                <span>Create Market</span>
              )}
            </button>

            {!tokensCreated && (
              <p className="text-[10px] text-zinc-600 text-center">
                Create tokens first to enable market creation
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
