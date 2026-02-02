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
    <div className="bg-purple-900/30 border border-purple-800/50 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-purple-200 mb-2">
            Welcome to OpenDEX! 🎉
          </h3>
          <div className="text-sm text-purple-100 space-y-2">
            <p>To start trading on <strong>Solana Devnet</strong>, you'll need test tokens:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Make sure you have SOL for transaction fees</li>
              <li>Create token accounts and mint test tokens</li>
              <li>Start trading on the order book</li>
            </ol>
            <div className="bg-purple-950/50 rounded p-3 mt-3 space-y-2">
              <p className="text-xs text-purple-300 font-medium">
                📋 Quick Setup Commands:
              </p>
              <div className="font-mono text-xs space-y-1 text-purple-200">
                <div className="flex items-center justify-between gap-2">
                  <code className="flex-1">solana airdrop 2</code>
                  <span className="text-purple-400 text-[10px]">SOL for fees</span>
                </div>
                <div className="border-t border-purple-800/50 pt-1 mt-1">
                  <div className="text-purple-400 text-[10px] mb-1">Base Token:</div>
                  <div className="text-[10px]">spl-token create-account DeRQ3...LLj8x</div>
                  <div className="text-[10px]">spl-token mint DeRQ3...LLj8x 1000</div>
                </div>
                <div className="border-t border-purple-800/50 pt-1 mt-1">
                  <div className="text-purple-400 text-[10px] mb-1">Quote Token:</div>
                  <div className="text-[10px]">spl-token create-account D3VykN...jADM</div>
                  <div className="text-[10px]">spl-token mint D3VykN...jADM 10000</div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <a
                href="https://github.com/MrBlackGhostt/orderBook/blob/main/AIRDROP_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
              >
                View Full Guide
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://x.com/HKsoldev"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-purple-900/50 hover:bg-purple-900/70 border border-purple-700 rounded-lg text-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                Need help? Contact @HKsoldev
              </a>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-purple-400 hover:text-purple-200 flex-shrink-0"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
