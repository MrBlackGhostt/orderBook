"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
  mintTo,
} from "@solana/spl-token";
import { Loader2, Check, AlertCircle, Gift } from "lucide-react";

interface WalletOnboardingProps {
  baseMint: PublicKey;
  quoteMint: PublicKey;
  onComplete?: () => void;
}

export function WalletOnboarding({
  baseMint,
  quoteMint,
  onComplete,
}: WalletOnboardingProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    baseAta: "checking" | "exists" | "creating" | "created";
    quoteAta: "checking" | "exists" | "creating" | "created";
    baseTokens: "checking" | "has" | "airdropping" | "airdropped";
    quoteTokens: "checking" | "has" | "airdropping" | "airdropped";
  }>({
    baseAta: "checking",
    quoteAta: "checking",
    baseTokens: "checking",
    quoteTokens: "checking",
  });
  const [error, setError] = useState<string | null>(null);

  const checkAndSetup = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);
    setIsOpen(true);

    try {
      const tx = new Transaction();
      let needsTransaction = false;

      // Check and create Base ATA
      const baseAta = getAssociatedTokenAddressSync(baseMint, publicKey);
      let baseAtaExists = false;
      try {
        await getAccount(connection, baseAta);
        setStatus((s) => ({ ...s, baseAta: "exists" }));
        baseAtaExists = true;
      } catch {
        setStatus((s) => ({ ...s, baseAta: "creating" }));
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            baseAta,
            publicKey,
            baseMint
          )
        );
        needsTransaction = true;
      }

      // Check and create Quote ATA
      const quoteAta = getAssociatedTokenAddressSync(quoteMint, publicKey);
      let quoteAtaExists = false;
      try {
        await getAccount(connection, quoteAta);
        setStatus((s) => ({ ...s, quoteAta: "exists" }));
        quoteAtaExists = true;
      } catch {
        setStatus((s) => ({ ...s, quoteAta: "creating" }));
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            quoteAta,
            publicKey,
            quoteMint
          )
        );
        needsTransaction = true;
      }

      // Create ATAs if needed
      if (needsTransaction) {
        const sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, "confirmed");
        setStatus((s) => ({
          ...s,
          baseAta: s.baseAta === "creating" ? "created" : s.baseAta,
          quoteAta: s.quoteAta === "creating" ? "created" : s.quoteAta,
        }));
      }

      // Note: Airdrop logic requires mint authority
      // For devnet testing, you'll need to manually airdrop tokens
      // or have a backend service that airdrops tokens

      setStatus((s) => ({
        ...s,
        baseTokens: "has",
        quoteTokens: "has",
      }));

      setTimeout(() => {
        setIsOpen(false);
        onComplete?.();
      }, 2000);
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err.message || "Failed to set up wallet");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-500" />
            Wallet Setup
          </h2>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          Setting up your wallet for trading. This will create token accounts
          if needed.
        </p>

        <div className="space-y-3">
          <StatusItem
            label="Base Token Account"
            status={status.baseAta}
            loading={loading}
          />
          <StatusItem
            label="Quote Token Account"
            status={status.quoteAta}
            loading={loading}
          />
        </div>

        {error && (
          <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-medium">Error</p>
              <p className="text-red-300 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {!error && !loading && (
          <div className="mt-4 bg-green-900/30 border border-green-800 rounded p-3 flex items-start gap-2">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 text-sm font-medium">
                Wallet Ready!
              </p>
              <p className="text-green-300 text-xs mt-1">
                You can now start trading
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(false)}
          className="mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  status,
  loading,
}: {
  label: string;
  status: string;
  loading: boolean;
}) {
  const getIcon = () => {
    if (status === "checking" || status === "creating" || status === "airdropping") {
      return <Loader2 className="w-4 h-4 animate-spin text-purple-500" />;
    }
    if (status === "exists" || status === "created" || status === "has" || status === "airdropped") {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    return <div className="w-4 h-4 rounded-full border-2 border-gray-700" />;
  };

  const getStatusText = () => {
    switch (status) {
      case "checking":
        return "Checking...";
      case "creating":
        return "Creating...";
      case "created":
        return "Created!";
      case "exists":
        return "Ready";
      case "airdropping":
        return "Airdropping...";
      case "airdropped":
        return "Airdropped!";
      case "has":
        return "Ready";
      default:
        return "Pending";
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">{getStatusText()}</span>
        {getIcon()}
      </div>
    </div>
  );
}

// Hook to trigger onboarding
export function useWalletOnboarding(baseMint: PublicKey, quoteMint: PublicKey) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkWallet = async () => {
      if (!publicKey || checked) return;

      try {
        const baseAta = getAssociatedTokenAddressSync(baseMint, publicKey);
        const quoteAta = getAssociatedTokenAddressSync(quoteMint, publicKey);

        let needsSetup = false;

        try {
          await getAccount(connection, baseAta);
        } catch {
          needsSetup = true;
        }

        try {
          await getAccount(connection, quoteAta);
        } catch {
          needsSetup = true;
        }

        setNeedsOnboarding(needsSetup);
        setChecked(true);
      } catch (err) {
        console.error("Error checking wallet:", err);
      }
    };

    checkWallet();
  }, [publicKey, baseMint, quoteMint, connection, checked]);

  return { needsOnboarding, setNeedsOnboarding };
}
