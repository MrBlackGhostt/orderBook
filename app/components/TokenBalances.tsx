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
}

export function TokenBalances({
  baseMint,
  quoteMint,
  baseSymbol = "BASE",
  quoteSymbol = "QUOTE",
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
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Wallet className="w-5 h-5" />
          <span className="text-sm">Connect wallet to view balances</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold">Your Balances</h3>
        </div>
        <button
          onClick={fetchBalances}
          disabled={loading}
          className="p-1.5 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
          title="Refresh balances"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-2">
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

      {balances.base === 0 && balances.quote === 0 && !loading && (
        <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded">
          <p className="text-yellow-400 text-xs">
            ⚠️ You need tokens to trade. Get test tokens from the faucet or
            contact the market creator.
          </p>
        </div>
      )}
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
    return balance < 0.01; // Warn if balance is very low
  };

  return (
    <div className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        {loading ? (
          <span className="text-sm text-gray-500">Loading...</span>
        ) : (
          <>
            <span
              className={`text-sm font-mono ${
                getLowBalanceWarning() ? "text-yellow-400" : "text-white"
              }`}
            >
              {balance !== null ? balance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              }) : "---"}
            </span>
            {getLowBalanceWarning() && (
              <span className="text-xs text-yellow-500" title="Low balance">
                ⚠️
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
