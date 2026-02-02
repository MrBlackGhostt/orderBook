"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { AlertCircle, X, ExternalLink } from "lucide-react";

export function NewUserBanner() {
  const { publicKey } = useWallet();
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const hasDismissed = localStorage.getItem("new-user-banner-dismissed");
    if (!hasDismissed && publicKey) {
      setShowBanner(true);
    }
  }, [publicKey]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    localStorage.setItem("new-user-banner-dismissed", "true");
  };

  if (!showBanner || dismissed || !publicKey) return null;

  return (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-200 text-sm mb-2">
            Welcome to OpenDEX
          </h3>
          <div className="text-xs text-blue-100/80 space-y-2">
            <p>To start trading on Solana Devnet, you need test tokens:</p>
            <ol className="list-decimal list-inside space-y-1 ml-1 text-blue-200/70">
              <li>Have SOL for transaction fees</li>
              <li>Create token accounts and mint test tokens</li>
              <li>Start trading on the order book</li>
            </ol>
            <div className="bg-[#0a0a0f] rounded-lg p-3 mt-3 space-y-2">
              <p className="text-[10px] text-blue-300 font-medium">
                Quick Setup Commands
              </p>
              <div className="font-mono text-[10px] space-y-1 text-blue-200/60">
                <div className="flex items-center justify-between gap-2">
                  <code>solana airdrop 2</code>
                  <span className="text-blue-400/60">SOL for fees</span>
                </div>
                <div className="border-t border-blue-500/10 pt-1 mt-1">
                  <div className="text-blue-400/60 mb-1">Base Token:</div>
                  <div>spl-token create-account DeRQ3...LLj8x</div>
                  <div>spl-token mint DeRQ3...LLj8x 1000</div>
                </div>
                <div className="border-t border-blue-500/10 pt-1 mt-1">
                  <div className="text-blue-400/60 mb-1">Quote Token:</div>
                  <div>spl-token create-account D3VykN...jADM</div>
                  <div>spl-token mint D3VykN...jADM 10000</div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <a
                href="https://github.com/MrBlackGhostt/orderBook/blob/main/AIRDROP_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors text-white"
              >
                View Full Guide
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://x.com/HKsoldev"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-xs inline-flex items-center justify-center gap-1.5 transition-colors text-blue-300"
              >
                Need help? Contact @HKsoldev
              </a>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-400/60 hover:text-blue-300 flex-shrink-0 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
