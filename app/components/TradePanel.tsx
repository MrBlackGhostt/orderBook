"use client";

import { useState, useEffect } from "react";
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
import { Loader2, AlertTriangle } from "lucide-react";
import { fromRawAmount } from "@/lib/constants";

interface TradePanelProps {
  market: MarketInfo | null;
  onOrderPlaced: () => void;
  baseSymbol?: string;
  quoteSymbol?: string;
}

export function TradePanel({
  market,
  onOrderPlaced,
  baseSymbol = "BASE",
  quoteSymbol = "QUOTE",
}: TradePanelProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { program } = useProgram();

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<{
    base: number;
    quote: number;
  }>({ base: 0, quote: 0 });

  // Fetch initial balances when market loads
  useEffect(() => {
    const fetchInitialBalances = async () => {
      if (!publicKey || !market) return;

      try {
        const baseMint = new PublicKey(market.baseMint);
        const quoteMint = new PublicKey(market.quoteMint);

        const baseAta = getAssociatedTokenAddressSync(baseMint, publicKey);
        const quoteAta = getAssociatedTokenAddressSync(quoteMint, publicKey);

        let baseBalance = 0;
        let quoteBalance = 0;

        try {
          const baseAccount = await getAccount(connection, baseAta);
          baseBalance = fromRawAmount(baseAccount.amount, BASE_DECIMALS);
        } catch {
          // ATA doesn't exist
        }

        try {
          const quoteAccount = await getAccount(connection, quoteAta);
          quoteBalance = fromRawAmount(quoteAccount.amount, QUOTE_DECIMALS);
        } catch {
          // ATA doesn't exist
        }

        setBalances({ base: baseBalance, quote: quoteBalance });
      } catch (err) {
        console.error("Error fetching balances:", err);
      }
    };

    fetchInitialBalances();
  }, [publicKey, market, connection]);

  // Helper to ensure ATA exists and fetch balance
  const ensureAta = async (
    mint: PublicKey,
    owner: PublicKey,
    decimals: number
  ): Promise<{ ata: PublicKey; balance: number }> => {
    const ata = getAssociatedTokenAddressSync(mint, owner);

    try {
      const account = await getAccount(connection, ata);
      // ATA exists
      return {
        ata,
        balance: fromRawAmount(account.amount, decimals),
      };
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
      return { ata, balance: 0 };
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

      // Ensure trader ATAs exist (creates if needed) and get balances
      const { ata: traderBaseAta, balance: baseBalance } = await ensureAta(
        baseMint,
        publicKey,
        BASE_DECIMALS
      );
      const { ata: traderQuoteAta, balance: quoteBalance } = await ensureAta(
        quoteMint,
        publicKey,
        QUOTE_DECIMALS
      );

      // Update balances for display
      setBalances({ base: baseBalance, quote: quoteBalance });

      // Check if user has enough balance
      if (side === "buy") {
        const totalCost = priceNum * amountNum;
        if (quoteBalance < totalCost) {
          throw new Error(
            `Insufficient ${quoteSymbol} balance. You have ${quoteBalance.toFixed(
              4
            )}, but need ${totalCost.toFixed(4)}`
          );
        }
      } else {
        if (baseBalance < amountNum) {
          throw new Error(
            `Insufficient ${baseSymbol} balance. You have ${baseBalance.toFixed(
              4
            )}, but need ${amountNum.toFixed(4)}`
          );
        }
      }

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
      
      // Better error messages
      let errorMessage = "Failed to place order";
      
      if (err.message?.includes("insufficient funds")) {
        errorMessage = `Insufficient ${
          side === "buy" ? quoteSymbol : baseSymbol
        } balance. Please add tokens to your wallet.`;
      } else if (err.message?.includes("Insufficient")) {
        errorMessage = err.message;
      } else if (err.message?.includes("simulation")) {
        errorMessage = "Transaction simulation failed. Check your token balances and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!market) {
    return (
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
        <p className="text-zinc-500 text-center text-sm">Loading market...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e1e2e]">
        <h2 className="text-sm font-medium text-white">Place Order</h2>
      </div>

      <div className="p-4">
        {/* Buy/Sell Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#1e1e2e] rounded-lg mb-4">
          <button
            onClick={() => setSide("buy")}
            className={`py-2 rounded-md text-sm font-medium transition-all ${
              side === "buy"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setSide("sell")}
            className={`py-2 rounded-md text-sm font-medium transition-all ${
              side === "sell"
                ? "bg-red-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sell
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Price</label>
            <input
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Amount</label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              required
            />
          </div>

          {price && amount && (
            <div className="flex justify-between items-center py-2 px-3 bg-[#1e1e2e] rounded-lg text-sm">
              <span className="text-zinc-500">Total</span>
              <span className="font-mono text-zinc-200">
                {(parseFloat(price) * parseFloat(amount) || 0).toFixed(4)} {quoteSymbol}
              </span>
            </div>
          )}

          {/* Balance info */}
          {publicKey && (
            <div className="space-y-1.5 py-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Available {baseSymbol}</span>
                <span className="font-mono text-zinc-400">{balances.base.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Available {quoteSymbol}</span>
                <span className="font-mono text-zinc-400">{balances.quote.toFixed(4)}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-red-300 text-xs">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !publicKey}
            className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              side === "buy"
                ? "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50"
                : "bg-red-600 hover:bg-red-700 disabled:bg-red-600/50"
            } disabled:cursor-not-allowed text-white`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Placing Order...</span>
              </>
            ) : (
              <span>{side === "buy" ? `Buy ${baseSymbol}` : `Sell ${baseSymbol}`}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
