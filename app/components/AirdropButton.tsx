"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
  createMintToInstruction,
} from "@solana/spl-token";
import { Gift, Loader2, Check, AlertCircle, ExternalLink } from "lucide-react";
import BN from "bn.js";

interface AirdropButtonProps {
  baseMint: PublicKey;
  quoteMint: PublicKey;
  onAirdropComplete?: () => void;
}

export function AirdropButton({
  baseMint,
  quoteMint,
  onAirdropComplete,
}: AirdropButtonProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "success" | "error" | "no-authority"
  >("idle");
  const [message, setMessage] = useState("");

  const handleAirdrop = async () => {
    if (!publicKey) return;

    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const tx = new Transaction();
      let needsTransaction = false;

      // Check and create Base ATA
      const baseAta = getAssociatedTokenAddressSync(baseMint, publicKey);
      try {
        await getAccount(connection, baseAta);
      } catch {
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
      try {
        await getAccount(connection, quoteAta);
      } catch {
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
      }

      // Check if user is the mint authority by checking mint account
      const baseMintInfo = await connection.getAccountInfo(baseMint);
      const quoteMintInfo = await connection.getAccountInfo(quoteMint);

      if (!baseMintInfo || !quoteMintInfo) {
        throw new Error("Could not fetch mint information");
      }

      // For SPL tokens, mint authority is at offset 4-36 in the account data
      // We'll try to mint, and if it fails, show CLI instructions
      try {
        const mintTx = new Transaction();

        // Attempt to mint BASE tokens (1000 with 9 decimals)
        const baseAmount = new BN(1000).mul(new BN(10).pow(new BN(9)));
        mintTx.add(
          createMintToInstruction(
            baseMint,
            baseAta,
            publicKey, // mint authority (will fail if not authority)
            BigInt(baseAmount.toString())
          )
        );

        // Attempt to mint QUOTE tokens (10000 with 6 decimals)
        const quoteAmount = new BN(10000).mul(new BN(10).pow(new BN(6)));
        mintTx.add(
          createMintToInstruction(
            quoteMint,
            quoteAta,
            publicKey, // mint authority (will fail if not authority)
            BigInt(quoteAmount.toString())
          )
        );

        const mintSig = await sendTransaction(mintTx, connection);
        await connection.confirmTransaction(mintSig, "confirmed");

        setStatus("success");
        setMessage("Successfully airdropped 1000 BASE and 10000 QUOTE tokens!");
        onAirdropComplete?.();
      } catch (mintError: any) {
        // Minting failed - likely not mint authority
        console.error("Mint error:", mintError);
        throw new Error("not_authority");
      }
    } catch (err: any) {
      console.error("Airdrop error:", err);

      // Check if it's a mint authority error
      if (
        err.message === "not_authority" ||
        err.message?.includes("owner does not match") ||
        err.message?.includes("incorrect authority") ||
        err.message?.includes("Error processing Instruction") ||
        err.logs?.some((log: string) => 
          log.includes("owner does not match") || 
          log.includes("incorrect program") ||
          log.includes("custom program error")
        )
      ) {
        setStatus("no-authority");
        setMessage(
          "You're not the mint authority. Use CLI commands below to get tokens."
        );
      } else if (err.message?.includes("User rejected")) {
        setStatus("error");
        setMessage("Transaction cancelled by user");
      } else {
        setStatus("error");
        setMessage(err.message || "Failed to airdrop tokens");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={handleAirdrop}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors text-white"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Airdropping...</span>
          </>
        ) : (
          <>
            <Gift className="w-4 h-4" />
            <span>Get Test Tokens</span>
          </>
        )}
      </button>

      {status === "success" && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start gap-2">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-300">{message}</div>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-300">{message}</div>
        </div>
      )}

      {status === "no-authority" && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-300">{message}</div>
          </div>
          <div className="text-[10px] text-amber-200/80 space-y-2 ml-6">
            <p className="font-medium">CLI Instructions:</p>
            
            <div className="space-y-2">
              <div>
                <p className="text-amber-300/90 mb-1">1. Get SOL for fees:</p>
                <div className="bg-[#0a0a0f] rounded p-2 font-mono text-amber-200/70">
                  solana airdrop 2
                </div>
              </div>

              <div>
                <p className="text-amber-300/90 mb-1">2. Create token accounts:</p>
                <div className="bg-[#0a0a0f] rounded p-2 font-mono text-amber-200/70 space-y-1">
                  <div className="break-all">spl-token create-account {baseMint.toBase58()}</div>
                  <div className="break-all">spl-token create-account {quoteMint.toBase58()}</div>
                </div>
              </div>

              <div>
                <p className="text-amber-300/90 mb-1">3. Mint test tokens:</p>
                <div className="bg-[#0a0a0f] rounded p-2 font-mono text-amber-200/70 space-y-1">
                  <div className="break-all">spl-token mint {baseMint.toBase58()} 1000</div>
                  <div className="break-all">spl-token mint {quoteMint.toBase58()} 10000</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-500/20">
              <a
                href="https://github.com/MrBlackGhostt/orderBook/blob/main/AIRDROP_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
              >
                View detailed guide
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
