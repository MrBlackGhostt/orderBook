"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";
import { Wallet, RefreshCw } from "lucide-react";
import { fromRawAmount, BASE_DECIMALS, QUOTE_DECIMALS } from "@/lib/constants";

interface TokenBalancesProps {
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseSymbol?: string;
  quoteSymbol?: string;
  compact?: boolean;
}

export function TokenBalances({
  baseMint,
  quoteMint,
  baseSymbol = "BASE",
  quoteSymbol = "QUOTE",
  compact = false,
}: TokenBalancesProps) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balances, setBalances] = useState<{
    base: number | null;
    quote: number | null;
  }>({ base: null, quote: null });
  const [loading, setLoading] = useState(false);

  const fetchBalances = async () => {
    if (!publicKey) {
      setBalances({ base: null, quote: null });
      return;
    }

    setLoading(true);
    try {
      const baseAta = getAssociatedTokenAddressSync(baseMint, publicKey);
      const quoteAta = getAssociatedTokenAddressSync(quoteMint, publicKey);

      let baseBalance = 0;
      let quoteBalance = 0;

      try {
        const baseAccount = await getAccount(connection, baseAta);
        baseBalance = fromRawAmount(baseAccount.amount, BASE_DECIMALS);
      } catch {
        // ATA doesn't exist
        baseBalance = 0;
      }

      try {
        const quoteAccount = await getAccount(connection, quoteAta);
        quoteBalance = fromRawAmount(quoteAccount.amount, QUOTE_DECIMALS);
      } catch {
        // ATA doesn't exist
        quoteBalance = 0;
      }

      setBalances({ base: baseBalance, quote: quoteBalance });
    } catch (err) {
      console.error("Error fetching balances:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    // Refresh every 10 seconds
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [publicKey, baseMint, quoteMint, connection]);

  if (!publicKey) {
    if (compact) {
      return (
        <div className="text-zinc-600 text-xs">
          Connect wallet to view balances
        </div>
      );
    }
    return (
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <Wallet className="w-4 h-4" />
          <span className="text-xs">Connect wallet to view balances</span>
        </div>
      </div>
    );
  }

  // Compact version for header
  if (compact) {
    return (
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5 text-zinc-500" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">{baseSymbol}:</span>
            <span className={`font-mono ${balances.base === 0 ? "text-amber-400" : "text-zinc-200"}`}>
              {balances.base !== null ? balances.base.toFixed(2) : "---"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">{quoteSymbol}:</span>
            <span className={`font-mono ${balances.quote === 0 ? "text-amber-400" : "text-zinc-200"}`}>
              {balances.quote !== null ? balances.quote.toFixed(2) : "---"}
            </span>
          </div>
        </div>
        <button
          onClick={fetchBalances}
          disabled={loading}
          className="p-1 hover:bg-white/5 rounded transition-colors disabled:opacity-50 text-zinc-500"
          title="Refresh balances"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    );
  }

  // Full version
  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-medium text-white">Your Balances</h3>
        </div>
        <button
          onClick={fetchBalances}
          disabled={loading}
          className="p-1.5 hover:bg-white/5 rounded transition-colors disabled:opacity-50 text-zinc-500"
          title="Refresh balances"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-4 space-y-2">
        <BalanceRow
          label={baseSymbol}
          balance={balances.base}
          loading={loading}
        />
        <BalanceRow
          label={quoteSymbol}
          balance={balances.quote}
          loading={loading}
        />
      </div>
    </div>
  );
}

function BalanceRow({
  label,
  balance,
  loading,
}: {
  label: string;
  balance: number | null;
  loading: boolean;
}) {
  const getLowBalanceWarning = () => {
    if (balance === null || loading) return false;
    return balance < 0.01;
  };

  return (
    <div className="flex items-center justify-between p-2.5 bg-[#0a0a0f] rounded-lg">
      <span className="text-xs text-zinc-500">{label}</span>
      <div className="flex items-center gap-2">
        {loading ? (
          <span className="text-xs text-zinc-600">Loading...</span>
        ) : (
          <>
            <span
              className={`text-xs font-mono ${
                getLowBalanceWarning() ? "text-amber-400" : "text-zinc-200"
              }`}
            >
              {balance !== null ? balance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              }) : "---"}
            </span>
            {getLowBalanceWarning() && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Low balance" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
