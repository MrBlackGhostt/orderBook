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
            <p>To start trading, you'll need test tokens:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Make sure you have SOL for transaction fees (airdrop with: <code className="bg-purple-950/50 px-1 py-0.5 rounded text-xs">solana airdrop 2</code>)</li>
              <li>Create token accounts and mint test tokens using the commands below:</li>
            </ol>
            <div className="bg-purple-950/50 rounded p-3 mt-2 font-mono text-xs overflow-x-auto">
              <div className="space-y-1 text-purple-200">
                <div># Base Token (9 decimals)</div>
                <div>spl-token create-account DeRQ3edcNvwH8XjEVtFiqLN8uiABcojbyjxhcE5LLj8x</div>
                <div>spl-token mint DeRQ3edcNvwH8XjEVtFiqLN8uiABcojbyjxhcE5LLj8x 1000</div>
                <div className="mt-2"># Quote Token (6 decimals)</div>
                <div>spl-token create-account D3VykNoT3ne9Rkn6tSy7ssGvhSq3NGN7mWtqQss4jADM</div>
                <div>spl-token mint D3VykNoT3ne9Rkn6tSy7ssGvhSq3NGN7mWtqQss4jADM 10000</div>
              </div>
            </div>
            <p className="mt-2">
              <a
                href="https://github.com/MrBlackGhostt/orderBook/blob/main/AIRDROP_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-purple-200 underline inline-flex items-center gap-1"
              >
                View detailed airdrop guide
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
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
